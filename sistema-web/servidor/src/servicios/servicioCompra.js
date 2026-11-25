import { createHash } from 'node:crypto';
import { ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorPagoRechazado } from '../errores/ErrorPagoRechazado.js';
import { ErrorPasarela } from '../errores/ErrorPasarela.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import {
  RESTRICCION_ASIENTO_VENDIDO,
  guardarMetodoPagoCliente,
  insertarDetallesBoletos,
  insertarFactura,
  obtenerDatosCliente,
  obtenerIdMetodoPago,
  obtenerMetodoPagoCliente,
  registrarIntencionPago,
} from '../repositorios/repositorioCompra.js';
import {
  bloquearReservaCliente,
  borrarReservaCliente,
  obtenerReservaCliente,
} from '../repositorios/repositorioReservaAsientos.js';
import { ahoraCostaRica } from '../utilidades/fechas.js';
import { cobrar, obtenerTarjeta, reembolsar } from './pasarelaPago.js';
import {
  MENSAJE_PAYPAL_NO_COMPLETADO,
  capturarOrden,
  consultarOrden,
  convertirADolares,
  crearOrden,
  reembolsarCaptura,
} from './pasarelaPayPal.js';
import { enviarComprobante } from './servicioComprobante.js';
import {
  MENSAJE_ASIENTO_NO_DISPONIBLE,
  MENSAJE_RESERVA_VENCIDA,
  armarCompraReservada,
  obtenerIdCliente,
  obtenerPreciosFuncion,
} from './servicioReserva.js';

export const NOMBRE_METODO_TARJETA = 'Tarjeta';
export const NOMBRE_METODO_PAYPAL = 'PayPal';
export const MENSAJE_SIN_TARJETA_GUARDADA = 'No tienes una tarjeta guardada';
export const MENSAJE_TARJETA_VENCIDA = 'Tu tarjeta guardada está vencida. Usa otra tarjeta.';

const CODIGO_ORACLE_DUPLICADO = 1;

// Los ids de ONVO son alfanuméricos (ej. cmvyv38ar0l1uk301e9jal5l8)
const PATRON_ID_METODO_PAGO = /^[A-Za-z0-9_-]{10,64}$/;

function validarIdProyeccion(idProyeccion) {
  if (!Number.isInteger(idProyeccion) || idProyeccion <= 0) {
    throw new ErrorValidacion('El id de la función no es válido');
  }
}

function validarIdMetodoPago(idMetodoPago) {
  if (typeof idMetodoPago !== 'string' || !PATRON_ID_METODO_PAGO.test(idMetodoPago)) {
    throw new ErrorValidacion('El método de pago no es válido');
  }
}

// 'AAAA-MM' de la tarjeta contra el mes actual en Costa Rica: vence al terminar ese mes
function estaVencida(vencimiento) {
  return vencimiento < ahoraCostaRica().slice(0, 7);
}

// Con usarTarjetaGuardada el token sale de la BD, buscado por el cliente de la sesión:
// nadie puede pagar con la tarjeta guardada de otra persona.
async function resolverMetodoPago(idCliente, datos) {
  if (datos?.usarTarjetaGuardada !== true) {
    validarIdMetodoPago(datos?.idMetodoPago);
    return datos.idMetodoPago;
  }

  const guardado = await obtenerMetodoPagoCliente(idCliente);
  if (!guardado) {
    throw new ErrorValidacion(MENSAJE_SIN_TARJETA_GUARDADA);
  }
  const [token, , , vencimiento] = guardado;
  if (estaVencida(vencimiento)) {
    throw new ErrorValidacion(MENSAJE_TARJETA_VENCIDA);
  }
  return token;
}

function esAsientoYaVendido(error) {
  return error?.errorNum === CODIGO_ORACLE_DUPLICADO && error.message?.includes(RESTRICCION_ASIENTO_VENDIDO);
}

// Si algo falla después de cobrar, se devuelve el dinero. Si el reembolso también falla, no se
// puede hacer más desde aquí: queda en el registro para revisarlo a mano en el panel de ONVO.
async function reembolsarSinFallar(reembolsarPago, idPago, total) {
  try {
    await reembolsarPago(idPago, total);
  } catch (error) {
    console.error(`No se pudo reembolsar el pago ${idPago} de una compra por ₡${total}:`, error);
  }
}

// Las dos tareas que siguen se hacen con la compra ya guardada. Si fallan, la compra sigue
// siendo válida: solo se avisa en la respuesta (correoEnviado, metodoGuardado).

async function enviarComprobanteSinFallar(idFactura, cliente) {
  try {
    await enviarComprobante(idFactura, cliente);
    return true;
  } catch (error) {
    console.error(`No se pudo enviar el comprobante de la factura ${idFactura}:`, error);
    return false;
  }
}

async function guardarMetodoPagoSinFallar(idCliente, idMetodo, idMetodoPago) {
  try {
    const tarjeta = await obtenerTarjeta(idMetodoPago);
    await guardarMetodoPagoCliente({
      idCliente,
      idMetodo,
      token: idMetodoPago,
      marca: tarjeta.marca,
      ultimosDigitos: tarjeta.ultimosDigitos,
      vencimiento: `${tarjeta.anioVencimiento}-${String(tarjeta.mesVencimiento).padStart(2, '0')}`,
      titular: tarjeta.titular,
    });
    return true;
  } catch (error) {
    console.error('No se pudo guardar el método de pago del cliente %d:', Number(idCliente), error);
    return false;
  }
}

// La reserva vale entera o no vale: si no hay filas o alguna ya venció, se trata como vencida
function esReservaVigente(filas) {
  return filas.length > 0 && filas.every(([, , vigente]) => vigente === 1);
}

// Registro de compra a partir de la reserva del cliente. Antes de la transacción se leen
// los precios de la función (ver obtenerPreciosFuncion). Luego, todo en una transacción:
//   1. Bloquea las filas de la reserva (FOR UPDATE). Si venció (toda o una parte), 409 sin cobrar.
//   2. Arma la compra con esos precios, inserta la factura y los detalles.
//   3. Cobra: cobrarPago(idFactura, compra) recibe { asientos, boletos, detalles, total }.
//   4. Registra el pago y borra la reserva. El commit confirma todo junto.
// Si falla el pago no se hace el commit; si falla después de cobrar, se reembolsa.
async function registrarCompra({ idCliente, nombreMetodo, idProyeccion, cobrarPago, reembolsarPago }) {
  const [cliente, idMetodo, precios] = await Promise.all([
    obtenerDatosCliente(idCliente),
    obtenerIdMetodoPago(nombreMetodo),
    obtenerPreciosFuncion(idProyeccion),
  ]);
  if (!cliente) {
    throw new ErrorNoEncontrado('El cliente no existe');
  }
  if (!idMetodo) {
    // Error de configuración de la BD (falta el INSERT en METODOS_PAGO): se responde 500
    throw new Error(`No existe el método de pago '${nombreMetodo}' en METODOS_PAGO`);
  }

  let cobro = null;
  let total = 0;
  let idFactura;

  try {
    idFactura = await ejecutarTransaccion(async (conexion) => {
      const filas = await bloquearReservaCliente(conexion, idCliente, idProyeccion);
      if (!esReservaVigente(filas)) throw new ErrorConflicto(MENSAJE_RESERVA_VENCIDA);

      // Sin consultas a la BD aquí: los precios ya se leyeron antes de abrir la transacción
      const compra = armarCompraReservada(filas, precios);
      total = compra.total;
      const id = await insertarFactura(conexion, { idCliente, idMetodo, monto: total, fecha: ahoraCostaRica() });

      try {
        await insertarDetallesBoletos(conexion, id, idProyeccion, compra.detalles);
      } catch (error) {
        if (esAsientoYaVendido(error)) throw new ErrorConflicto(MENSAJE_ASIENTO_NO_DISPONIBLE);
        throw error;
      }

      cobro = await cobrarPago(id, compra);
      await registrarIntencionPago(conexion, id, cobro.idPago);
      await borrarReservaCliente(conexion, idCliente);
      return id;
    });
  } catch (error) {
    if (cobro) {
      // Se cobró pero la compra no se guardó (falló el UPDATE, el DELETE o el commit)
      await reembolsarSinFallar(reembolsarPago, cobro.idPago, total);
    } else if (error instanceof ErrorPasarela && error.idIntencion) {
      // No se sabe si la pasarela alcanzó a cobrar: por si acaso se pide el reembolso
      await reembolsarSinFallar(reembolsarPago, error.idIntencion, total);
    }
    throw error;
  }

  // La compra ya está guardada: desde aquí nada debe reembolsar
  const [nombre, , correo] = cliente;
  const correoEnviado = await enviarComprobanteSinFallar(idFactura, { idCliente, nombre, correo });

  return { idFactura, idMetodo, total, referencia: cobro.referencia, correoEnviado };
}

// Compra con tarjeta (ONVO): una nueva, con idMetodoPago, o la guardada, con usarTarjetaGuardada: true.
// Los asientos y boletos salen de la reserva del cliente, no del cuerpo de la petición.
export async function comprarBoletos(usuario, idProyeccion, datos) {
  const idCliente = obtenerIdCliente(usuario);
  validarIdProyeccion(idProyeccion);
  const idMetodoPago = await resolverMetodoPago(idCliente, datos);
  const guardarTarjeta = datos?.guardarMetodo === true && datos?.usarTarjetaGuardada !== true;

  const { idMetodo, ...compra } = await registrarCompra({
    idCliente,
    nombreMetodo: NOMBRE_METODO_TARJETA,
    idProyeccion,
    cobrarPago: async (idFactura, { total }) => {
      const { idIntencion, referencia } = await cobrar({
        monto: total,
        idMetodoPago,
        descripcion: `Cine Aurora - Factura ${idFactura}`,
      });
      return { idPago: idIntencion, referencia };
    },
    reembolsarPago: (idIntencion, total) => reembolsar(idIntencion, total),
  });

  const metodoGuardado = guardarTarjeta ? await guardarMetodoPagoSinFallar(idCliente, idMetodo, idMetodoPago) : false;
  return { ...compra, metodoGuardado };
}


// Los ids de orden de PayPal son mayúsculas y números
const PATRON_ID_ORDEN_PAYPAL = /^[A-Z0-9]{10,30}$/;


export function calcularHuella(idCliente, idProyeccion, asientos, boletos) {
  const contenido = JSON.stringify({
    cliente: idCliente,
    funcion: idProyeccion,
    asientos: [...asientos].sort((a, b) => a - b),
    boletos: [...boletos].sort((a, b) => a.idTipoBoleto - b.idTipoBoleto).map((b) => [b.idTipoBoleto, b.cantidad]),
  });
  return createHash('sha256').update(contenido).digest('hex');
}

// Reserva vigente del cliente para esta función, sin bloquearla: [[idAsiento, idTipoBoleto]]
async function filasReservaVigente(idCliente, idProyeccion) {
  const filas = (await obtenerReservaCliente(idCliente))
    .filter(([idProyeccionReserva]) => idProyeccionReserva === idProyeccion)
    .map(([, idAsiento, idTipoBoleto]) => [idAsiento, idTipoBoleto]);
  if (filas.length === 0) throw new ErrorConflicto(MENSAJE_RESERVA_VENCIDA);
  return filas;
}

// PayPal, paso 1: crea la orden por el total de la reserva. La huella amarra la orden a esos asientos.
export async function iniciarPagoPayPal(usuario, idProyeccion) {
  const idCliente = obtenerIdCliente(usuario);
  validarIdProyeccion(idProyeccion);
  const filas = await filasReservaVigente(idCliente, idProyeccion);
  const { asientos, boletos, total } = armarCompraReservada(filas, await obtenerPreciosFuncion(idProyeccion));

  const idOrden = await crearOrden({
    montoDolares: convertirADolares(total),
    huella: calcularHuella(idCliente, idProyeccion, asientos, boletos),
    descripcion: `Cine Aurora - ${asientos.length} ${asientos.length === 1 ? 'boleto' : 'boletos'}`,
  });
  return { idOrden };
}

// PayPal, paso 2: el cliente aprobó. Con la reserva ya bloqueada se revisa que la orden
// corresponda a esos asientos y a ese total, y recién entonces se captura.
// Si la reserva venció mientras el cliente estaba en PayPal, falla (409) sin capturar.
export async function completarPagoPayPal(usuario, idProyeccion, idOrden) {
  const idCliente = obtenerIdCliente(usuario);
  validarIdProyeccion(idProyeccion);
  if (typeof idOrden !== 'string' || !PATRON_ID_ORDEN_PAYPAL.test(idOrden)) {
    throw new ErrorValidacion('La orden de PayPal no es válida');
  }

  const orden = await consultarOrden(idOrden);
  if (orden.estado !== 'APPROVED') {
    throw new ErrorPagoRechazado(MENSAJE_PAYPAL_NO_COMPLETADO);
  }

  const { idMetodo, ...compra } = await registrarCompra({
    idCliente,
    nombreMetodo: NOMBRE_METODO_PAYPAL,
    idProyeccion,
    cobrarPago: async (_idFactura, { asientos, boletos, total }) => {
      const huellaEsperada = calcularHuella(idCliente, idProyeccion, asientos, boletos);
      if (orden.huella !== huellaEsperada || orden.moneda !== 'USD' || orden.montoDolares !== convertirADolares(total)) {
        throw new ErrorValidacion('La orden de PayPal no corresponde a esta compra');
      }
      return capturarOrden(idOrden);
    },
    reembolsarPago: (idCaptura) => reembolsarCaptura(idCaptura),
  });
  return compra;
}

// Tarjeta guardada del cliente para mostrarla en la pantalla de pago (sin el token).
// Devuelve null si no tiene ninguna.
export async function consultarMetodoPagoGuardado(usuario) {
  const idCliente = obtenerIdCliente(usuario);

  const guardado = await obtenerMetodoPagoCliente(idCliente);
  if (!guardado) return null;

  const [, marca, ultimosDigitos, vencimiento, titular] = guardado;
  const [anio, mes] = vencimiento.split('-');
  return {
    marca,
    ultimosDigitos,
    vencimiento: `${mes}/${anio.slice(2)}`,
    titular,
    vencida: estaVencida(vencimiento),
  };
}

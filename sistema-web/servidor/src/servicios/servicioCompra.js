import { createHash } from 'node:crypto';
import { ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoAutenticado } from '../errores/ErrorNoAutenticado.js';
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
import { MENSAJE_ASIENTO_NO_DISPONIBLE, validarSeleccion } from './servicioReserva.js';

export const NOMBRE_METODO_TARJETA = 'Tarjeta';
export const NOMBRE_METODO_PAYPAL = 'PayPal';
export const MENSAJE_SIN_TARJETA_GUARDADA = 'No tienes una tarjeta guardada';
export const MENSAJE_TARJETA_VENCIDA = 'Tu tarjeta guardada está vencida. Usa otra tarjeta.';

const CODIGO_ORACLE_DUPLICADO = 1;

// Los ids de ONVO son alfanuméricos (ej. cmvyv38ar0l1uk301e9jal5l8)
const PATRON_ID_METODO_PAGO = /^[A-Za-z0-9_-]{10,64}$/;

// Los tokens emitidos antes de agregar idCliente (y los del personal) no sirven para comprar
function obtenerIdCliente(usuario) {
  const idCliente = usuario?.idCliente;
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ErrorNoAutenticado('Tu sesión no es válida para comprar. Inicia sesión de nuevo.');
  }
  return idCliente;
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

// Repartir asientos
export function asignarBoletos(asientos, boletos, precios) {
  const tipos = boletos.flatMap(({ idTipoBoleto, cantidad }) => Array(cantidad).fill(idTipoBoleto));
  return asientos.map((idAsiento, indice) => ({
    idAsiento,
    idTipoBoleto: tipos[indice],
    ...precios.get(tipos[indice]),
  }));
}

// Si algo falla después de cobrar, se devuelve el dinero. Si el reembolso también falla, no se
// puede hacer más desde aquí: queda en el registro para revisarlo a mano en el panel de ONVO.
async function reembolsarSinFallar(reembolsarPago, idPago, total) {
  try {
    await reembolsarPago(idPago);
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

// Registro de compra, si falla el pago no se hace el commit
async function registrarCompra({ idCliente, nombreMetodo, idProyeccion, seleccion, cobrarPago, reembolsarPago }) {
  const { asientos, boletos, precios, total } = seleccion;

  const [cliente, idMetodo] = await Promise.all([obtenerDatosCliente(idCliente), obtenerIdMetodoPago(nombreMetodo)]);
  if (!cliente) {
    throw new ErrorNoEncontrado('El cliente no existe');
  }
  if (!idMetodo) {
    // Error de configuración de la BD (falta el INSERT en METODOS_PAGO): se responde 500
    throw new Error(`No existe el método de pago '${nombreMetodo}' en METODOS_PAGO`);
  }

  const detalles = asignarBoletos(asientos, boletos, precios);
  let cobro = null;
  let idFactura;

  try {
    idFactura = await ejecutarTransaccion(async (conexion) => {
      const id = await insertarFactura(conexion, { idCliente, idMetodo, monto: total, fecha: ahoraCostaRica() });

      try {
        await insertarDetallesBoletos(conexion, id, idProyeccion, detalles);
      } catch (error) {
        if (esAsientoYaVendido(error)) throw new ErrorConflicto(MENSAJE_ASIENTO_NO_DISPONIBLE);
        throw error;
      }

      cobro = await cobrarPago(id);
      await registrarIntencionPago(conexion, id, cobro.idPago);
      return id;
    });
  } catch (error) {
    if (cobro) {
      // Se cobró pero la compra no se guardó (falló el UPDATE o el commit)
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
export async function comprarBoletos(usuario, idProyeccion, datos) {
  const idCliente = obtenerIdCliente(usuario);
  const idMetodoPago = await resolverMetodoPago(idCliente, datos);
  const guardarTarjeta = datos?.guardarMetodo === true && datos?.usarTarjetaGuardada !== true;

  // Revisa la selección y los asientos libres antes de tocar la pasarela
  const seleccion = await validarSeleccion(idProyeccion, datos);

  const { idMetodo, ...compra } = await registrarCompra({
    idCliente,
    nombreMetodo: NOMBRE_METODO_TARJETA,
    idProyeccion,
    seleccion,
    cobrarPago: async (idFactura) => {
      const { idIntencion, referencia } = await cobrar({
        monto: seleccion.total,
        idMetodoPago,
        descripcion: `Cine Aurora - Factura ${idFactura}`,
      });
      return { idPago: idIntencion, referencia };
    },
    reembolsarPago: (idIntencion) => reembolsar(idIntencion, seleccion.total),
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

export async function iniciarPagoPayPal(usuario, idProyeccion, datos) {
  const idCliente = obtenerIdCliente(usuario);
  const { asientos, boletos, total } = await validarSeleccion(idProyeccion, datos);

  const idOrden = await crearOrden({
    montoDolares: convertirADolares(total),
    huella: calcularHuella(idCliente, idProyeccion, asientos, boletos),
    descripcion: `Cine Aurora - ${asientos.length} ${asientos.length === 1 ? 'boleto' : 'boletos'}`,
  });
  return { idOrden };
}

export async function completarPagoPayPal(usuario, idProyeccion, idOrden, datos) {
  const idCliente = obtenerIdCliente(usuario);
  if (typeof idOrden !== 'string' || !PATRON_ID_ORDEN_PAYPAL.test(idOrden)) {
    throw new ErrorValidacion('La orden de PayPal no es válida');
  }

  // Si algún asiento se vendió mientras el cliente estaba en PayPal, falla aquí (409) sin capturar
  const seleccion = await validarSeleccion(idProyeccion, datos);

  const orden = await consultarOrden(idOrden);
  if (orden.estado !== 'APPROVED') {
    throw new ErrorPagoRechazado(MENSAJE_PAYPAL_NO_COMPLETADO);
  }
  const huellaEsperada = calcularHuella(idCliente, idProyeccion, seleccion.asientos, seleccion.boletos);
  if (orden.huella !== huellaEsperada || orden.moneda !== 'USD' || orden.montoDolares !== convertirADolares(seleccion.total)) {
    throw new ErrorValidacion('La orden de PayPal no corresponde a esta compra');
  }

  const { idMetodo, ...compra } = await registrarCompra({
    idCliente,
    nombreMetodo: NOMBRE_METODO_PAYPAL,
    idProyeccion,
    seleccion,
    cobrarPago: () => capturarOrden(idOrden),
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

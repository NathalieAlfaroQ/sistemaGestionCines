import { ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoAutenticado } from '../errores/ErrorNoAutenticado.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorPasarela } from '../errores/ErrorPasarela.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import {
  RESTRICCION_ASIENTO_VENDIDO,
  insertarDetallesBoletos,
  insertarFactura,
  obtenerDatosCliente,
  obtenerIdMetodoPago,
  registrarIntencionPago,
} from '../repositorios/repositorioCompra.js';
import { ahoraCostaRica } from '../utilidades/fechas.js';
import { cobrar, reembolsar } from './pasarelaPago.js';
import { enviarComprobante } from './servicioComprobante.js';
import { MENSAJE_ASIENTO_NO_DISPONIBLE, validarSeleccion } from './servicioReserva.js';

export const NOMBRE_METODO_TARJETA = 'Tarjeta';

const CODIGO_ORACLE_DUPLICADO = 1;

// Los ids de ONVO son alfanuméricos (ej. cmvyv38ar0l1uk301e9jal5l8)
const PATRON_ID_METODO_PAGO = /^[A-Za-z0-9_-]{10,64}$/;

function validarIdMetodoPago(idMetodoPago) {
  if (typeof idMetodoPago !== 'string' || !PATRON_ID_METODO_PAGO.test(idMetodoPago)) {
    throw new ErrorValidacion('El método de pago no es válido');
  }
}

function esAsientoYaVendido(error) {
  return error?.errorNum === CODIGO_ORACLE_DUPLICADO && error.message?.includes(RESTRICCION_ASIENTO_VENDIDO);
}

// Reparte los tipos de boleto entre los asientos en orden (da igual cuál asiento es "el del niño").
// Devuelve una línea por asiento: [{ idAsiento, idTipoBoleto, monto, descuento }]
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
async function reembolsarSinFallar(idIntencion, monto) {
  try {
    await reembolsar(idIntencion, monto);
  } catch (error) {
    console.error(`No se pudo reembolsar la intención de pago ${idIntencion} por ₡${monto}:`, error);
  }
}

// El correo se manda después de guardar la compra. Si falla, la compra sigue siendo válida:
// el cliente ve "Compra exitosa" y puede descargar sus boletos en pantalla.
async function enviarComprobanteSinFallar(idFactura, cliente) {
  try {
    await enviarComprobante(idFactura, cliente);
    return true;
  } catch (error) {
    console.error(`No se pudo enviar el comprobante de la factura ${idFactura}:`, error);
    return false;
  }
}

// Compra los boletos de la selección y los cobra con la tarjeta registrada en ONVO.
// Orden: validar -> insertar factura y detalles (sin commit) -> cobrar -> commit.
// Así nunca se cobra un asiento que no se pudo vender: si el asiento ya se vendió, el
// INSERT falla antes de cobrar. Si algo falla después de cobrar, se reembolsa.
export async function comprarBoletos(usuario, idProyeccion, datos) {
  // Los tokens emitidos antes de agregar idCliente no sirven para comprar
  const idCliente = usuario?.idCliente;
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ErrorNoAutenticado('Tu sesión no es válida para comprar. Inicia sesión de nuevo.');
  }

  const idMetodoPago = datos?.idMetodoPago;
  validarIdMetodoPago(idMetodoPago);

  // Revisa la selección y los asientos libres antes de tocar la pasarela
  const { asientos, boletos, precios, total } = await validarSeleccion(idProyeccion, datos);

  const [cliente, idMetodo] = await Promise.all([
    obtenerDatosCliente(idCliente),
    obtenerIdMetodoPago(NOMBRE_METODO_TARJETA),
  ]);
  if (!cliente) {
    throw new ErrorNoEncontrado('El cliente no existe');
  }
  if (!idMetodo) {
    // Error de configuración de la BD (falta el INSERT en METODOS_PAGO): se responde 500
    throw new Error(`No existe el método de pago '${NOMBRE_METODO_TARJETA}' en METODOS_PAGO`);
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

      cobro = await cobrar({ monto: total, idMetodoPago, descripcion: `Cine Aurora - Factura ${id}` });
      await registrarIntencionPago(conexion, id, cobro.idIntencion);
      return id;
    });
  } catch (error) {
    if (cobro) {
      // Se cobró pero la compra no se guardó (falló el UPDATE o el commit)
      await reembolsarSinFallar(cobro.idIntencion, total);
    } else if (error instanceof ErrorPasarela && error.idIntencion) {
      // No se sabe si ONVO alcanzó a cobrar: por si acaso se pide el reembolso
      await reembolsarSinFallar(error.idIntencion, total);
    }
    throw error;
  }

  // La compra ya está guardada: desde aquí nada debe reembolsar
  const [nombre, , correo] = cliente;
  const correoEnviado = await enviarComprobanteSinFallar(idFactura, { idCliente, nombre, correo });

  return { idFactura, total, referencia: cobro.referencia, correoEnviado };
}

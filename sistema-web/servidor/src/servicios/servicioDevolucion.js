import { ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorPasarela } from '../errores/ErrorPasarela.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { obtenerDatosCliente } from '../repositorios/repositorioCompra.js';
import {
  ERRORES_DEVOLUCION,
  confirmarDevolucion,
  solicitarDevolucion,
} from '../repositorios/repositorioDevolucion.js';
import { reembolsar } from './pasarelaPago.js';
import { reembolsarCaptura } from './pasarelaPayPal.js';
import { NOMBRE_METODO_PAYPAL, NOMBRE_METODO_TARJETA } from './servicioCompra.js';
import { enviarConfirmacionDevolucion, obtenerCompraParaDevolucion } from './servicioComprobante.js';
import { obtenerIdCliente } from './servicioReserva.js';

export const MENSAJE_COMPRA_NO_EXISTE = 'La compra no existe';
export const MENSAJE_COMPRA_YA_CANCELADA = 'Esta compra ya fue cancelada';
export const MENSAJE_FUERA_DE_PLAZO = 'Solo puedes cancelar tu compra hasta 5 días antes de la función';
export const MENSAJE_ERROR_REEMBOLSO =
  'No se pudo procesar la devolución en este momento. Tu compra sigue activa; intenta de nuevo más tarde.';

function validarIdFactura(idFactura) {
  if (!Number.isInteger(idFactura) || idFactura <= 0) {
    throw new ErrorValidacion('El id de la compra no es válido');
  }
}

// Errores de negocio de PR_SOLICITAR_DEVOLUCION -> errores del servidor (y su código HTTP).
// Los demás (sin pago registrado, sin devolución por confirmar, fallas de la BD) son errores
// internos: se dejan pasar y el manejador central responde 500.
function traducirErrorBaseDatos(error) {
  switch (error?.errorNum) {
    case ERRORES_DEVOLUCION.compraNoExiste:
      return new ErrorNoEncontrado(MENSAJE_COMPRA_NO_EXISTE);
    case ERRORES_DEVOLUCION.compraYaCancelada:
      return new ErrorConflicto(MENSAJE_COMPRA_YA_CANCELADA);
    case ERRORES_DEVOLUCION.fueraDePlazo:
      return new ErrorConflicto(MENSAJE_FUERA_DE_PLAZO);
    default:
      return error;
  }
}

// Devuelve el dinero por el mismo medio de pago. Devuelve el id del reembolso (puede ser null).
// Si el monto es 0 (compra 100 % con descuento) no hay nada que reembolsar en la pasarela.
async function reembolsarPorMetodo({ monto, idPago, metodo }) {
  if (monto === 0) return null;

  try {
    if (metodo === NOMBRE_METODO_TARJETA) return await reembolsar(idPago, monto);
    if (metodo === NOMBRE_METODO_PAYPAL) return await reembolsarCaptura(idPago);
  } catch (error) {
    // Los mensajes de las pasarelas hablan de "pago": para el cliente es una devolución
    if (error instanceof ErrorPasarela) throw new ErrorPasarela(MENSAJE_ERROR_REEMBOLSO, error.idIntencion);
    throw error;
  }
  // Error de configuración: un método en METODOS_PAGO que el servidor no sabe reembolsar (500)
  throw new Error(`No se sabe reembolsar el método de pago '${metodo}'`);
}

// La devolución ya está guardada: si el correo falla no se deshace, solo se avisa en la respuesta
async function enviarConfirmacionSinFallar(idFactura, datos) {
  try {
    await enviarConfirmacionDevolucion(datos);
    return true;
  } catch (error) {
    console.error(`No se pudo enviar la confirmación de la devolución de la factura ${idFactura}:`, error);
    return false;
  }
}

// Cancela la compra completa del cliente y le devuelve el dinero.
// Antes de la transacción se leen los datos del cliente y de la compra para el correo
// (así la transacción no pide otra conexión al pool). Después, todo en una transacción:
//   1. PR_SOLICITAR_DEVOLUCION: bloquea la factura, valida los 5 días, marca los boletos DEVUELTO.
//   2. Reembolso en la pasarela (ONVO o PayPal).
//   3. PR_CONFIRMAR_DEVOLUCION: guarda el id del reembolso.
//   4. COMMIT: los asientos quedan libres para la venta.
// Si el reembolso falla, ROLLBACK: los boletos siguen activos y el cliente puede intentarlo de nuevo.
// Con la devolución confirmada se envía el correo (SCRUM-51).
// Devuelve { idFactura, monto, metodo, correoEnviado }.
export async function devolverCompra(usuario, idFactura) {
  const idCliente = obtenerIdCliente(usuario);
  validarIdFactura(idFactura);

  const [cliente, compra] = await Promise.all([
    obtenerDatosCliente(idCliente),
    obtenerCompraParaDevolucion(idFactura, idCliente),
  ]);
  if (!cliente || !compra) {
    throw new ErrorNoEncontrado(MENSAJE_COMPRA_NO_EXISTE);
  }

  let idReembolso;
  let reembolsado = false;
  let solicitud;

  try {
    solicitud = await ejecutarTransaccion(async (conexion) => {
      const datos = await solicitarDevolucion(conexion, idFactura, idCliente);
      idReembolso = await reembolsarPorMetodo(datos);
      reembolsado = true;
      await confirmarDevolucion(conexion, idFactura, idReembolso);
      return datos;
    });
  } catch (error) {
    if (reembolsado) {
      // El único caso que no se puede deshacer: el dinero ya se devolvió pero la devolución no quedó
      // guardada (falló la confirmación o el COMMIT). Los boletos siguen activos: hay que revisarlo a mano.
      console.error(
        `La factura ${idFactura} se reembolsó (reembolso ${idReembolso ?? 'sin id'}) pero la devolución no se guardó:`,
        error
      );
    } else if (error instanceof ErrorPasarela) {
      // La pasarela falló o no respondió: no se sabe si alcanzó a devolver el dinero. Se hace ROLLBACK
      // (los boletos siguen activos) y queda en el registro para revisarlo en el panel de la pasarela.
      console.error(`No se pudo reembolsar la factura ${idFactura} (pago ${error.idIntencion ?? 'desconocido'}):`, error);
    }
    throw traducirErrorBaseDatos(error);
  }

  // La devolución ya está guardada: desde aquí nada la deshace
  const { monto, metodo } = solicitud;
  const [nombre, , correo] = cliente;
  const correoEnviado = await enviarConfirmacionSinFallar(idFactura, {
    compra,
    cliente: { nombre, correo },
    monto,
    metodo,
  });

  return { idFactura, monto, metodo, correoEnviado };
}

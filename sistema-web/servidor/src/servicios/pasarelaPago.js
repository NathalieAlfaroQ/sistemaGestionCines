import { configuracionOnvo } from '../configuracion/onvo.js';
import { ErrorPagoRechazado } from '../errores/ErrorPagoRechazado.js';
import { ErrorPasarela } from '../errores/ErrorPasarela.js';

// Adaptador de la pasarela de pago ONVO. El resto del servidor solo conoce cobrar() y reembolsar();

export const MENSAJE_PAGO_RECHAZADO =
  'El pago no pudo ser procesado. Verifica los datos de tu tarjeta o intenta con otro método de pago.';
export const MENSAJE_ERROR_PASARELA = 'No se pudo procesar el pago en este momento. Intenta de nuevo más tarde.';

const MONEDA = 'CRC';

// Estados de una intención de pago en ONVO
const ESTADO_APROBADO = 'succeeded';
const ESTADO_PROCESANDO = 'processing';

const CODIGOS_RECHAZO = new Set([400, 402, 404, 422]);

async function peticion(metodo, ruta, cuerpo, idIntencion = null) {
  let respuesta;
  try {
    respuesta = await fetch(`${configuracionOnvo.urlApi}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${configuracionOnvo.llaveSecreta}`,
        'Content-Type': 'application/json',
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(configuracionOnvo.tiempoEsperaMs),
    });
  } catch {
    throw new ErrorPasarela(MENSAJE_ERROR_PASARELA, idIntencion);
  }

  const datos = await respuesta.json().catch(() => null);
  return { ok: respuesta.ok, estadoHttp: respuesta.status, datos };
}

// Cuando no se sabe si ONVO alcanzó a cobrar (tiempo agotado o error 5xx al confirmar),
// se consulta el estado real de la intención antes de decidir.
async function consultarIntencion(idIntencion) {
  const respuesta = await peticion('GET', `/payment-intents/${idIntencion}`, undefined, idIntencion);
  if (!respuesta.ok) {
    throw new ErrorPasarela(MENSAJE_ERROR_PASARELA, idIntencion);
  }
  return respuesta.datos;
}

async function confirmarIntencion(idIntencion, idMetodoPago) {
  let respuesta;
  try {
    respuesta = await peticion(
      'POST',
      `/payment-intents/${idIntencion}/confirm`,
      { paymentMethodId: idMetodoPago },
      idIntencion
    );
  } catch {
    // No hubo respuesta al confirmar: puede que el cobro sí se hiciera
    return await consultarIntencion(idIntencion);
  }

  if (respuesta.ok) return respuesta.datos;
  if (CODIGOS_RECHAZO.has(respuesta.estadoHttp)) throw new ErrorPagoRechazado(MENSAJE_PAGO_RECHAZADO);
  // 5xx u otra respuesta inesperada: tampoco se sabe si se cobró
  return await consultarIntencion(idIntencion);
}

export async function cobrar({ monto, idMetodoPago, descripcion }) {
  const creada = await peticion('POST', '/payment-intents', {
    amount: monto,
    currency: MONEDA,
    description: descripcion,
  });
  if (!creada.ok) {
    throw new ErrorPasarela(MENSAJE_ERROR_PASARELA);
  }
  const idIntencion = creada.datos.id;

  const intencion = await confirmarIntencion(idIntencion, idMetodoPago);

  if (intencion.status === ESTADO_APROBADO) {
    return { idIntencion, referencia: intencion.charges?.at(-1)?.refNumber || null };
  }
  if (intencion.status === ESTADO_PROCESANDO) {
    // Todavía no hay respuesta final: no se puede dar por pagado ni por rechazado
    throw new ErrorPasarela(MENSAJE_ERROR_PASARELA, idIntencion);
  }
  // requires_payment_method (rechazada), requires_action (3DS, fuera del alcance) o canceled
  throw new ErrorPagoRechazado(MENSAJE_PAGO_RECHAZADO);
}

// Se piden a ONVO con la llave secreta en vez de creerle a lo que mande el navegador.
export async function obtenerTarjeta(idMetodoPago) {
  const respuesta = await peticion('GET', `/payment-methods/${encodeURIComponent(idMetodoPago)}`);
  const tarjeta = respuesta.datos?.card;
  if (!respuesta.ok || respuesta.datos?.type !== 'card' || !tarjeta) {
    throw new ErrorPasarela(MENSAJE_ERROR_PASARELA);
  }

  return {
    marca: tarjeta.brand,
    ultimosDigitos: tarjeta.last4,
    mesVencimiento: tarjeta.expMonth,
    anioVencimiento: tarjeta.expYear,
    titular: tarjeta.holderName,
  };
}

// Devuelve el dinero de un cobro aprobado. Se usa si la compra no se pudo guardar después de cobrar.
export async function reembolsar(idIntencion, monto) {
  const respuesta = await peticion('POST', '/refunds', { paymentIntentId: idIntencion, amount: monto }, idIntencion);
  if (!respuesta.ok) {
    throw new ErrorPasarela(MENSAJE_ERROR_PASARELA, idIntencion);
  }
  return respuesta.datos?.id ?? null;
}
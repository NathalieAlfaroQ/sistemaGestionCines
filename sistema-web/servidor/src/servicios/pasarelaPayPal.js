import { configuracionPayPal } from '../configuracion/paypal.js';
import { ErrorPagoRechazado } from '../errores/ErrorPagoRechazado.js';
import { ErrorPasarela } from '../errores/ErrorPasarela.js';


export const MENSAJE_PAYPAL_NO_COMPLETADO = 'La transacción fue cancelada o no pudo completarse.';
export const MENSAJE_ERROR_PAYPAL = 'No se pudo procesar el pago con PayPal en este momento. Intenta de nuevo más tarde.';

const MONEDA = 'USD';
const ESTADO_COMPLETADO = 'COMPLETED';

const CODIGOS_RECHAZO = new Set([400, 404, 422]);

// El token de acceso dura varias horas: se reutiliza hasta un minuto antes de que venza
let tokenEnCache = null;

export function olvidarToken() {
  tokenEnCache = null;
}

async function llamar(url, opciones) {
  try {
    return await fetch(url, { ...opciones, signal: AbortSignal.timeout(configuracionPayPal.tiempoEsperaMs) });
  } catch {
    throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL);
  }
}

async function obtenerToken() {
  if (tokenEnCache && Date.now() < tokenEnCache.venceEn) return tokenEnCache.valor;

  const credenciales = Buffer.from(`${configuracionPayPal.idCliente}:${configuracionPayPal.secretoCliente}`).toString(
    'base64'
  );
  const respuesta = await llamar(`${configuracionPayPal.urlApi}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenciales}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !datos?.access_token) {
    throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL);
  }

  tokenEnCache = { valor: datos.access_token, venceEn: Date.now() + (datos.expires_in - 60) * 1000 };
  return tokenEnCache.valor;
}

// Hace la petición a PayPal. Solo lanza error si no hubo respuesta; las respuestas con error
// las interpreta quien llama.
async function peticion(metodo, ruta, cuerpo) {
  const token = await obtenerToken();
  const respuesta = await llamar(`${configuracionPayPal.urlApi}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => null);
  return { ok: respuesta.ok, estadoHttp: respuesta.status, datos };
}

// ₡ -> $ con el tipo de cambio del .env, redondeado a centavos. Devuelve texto ('6.53'),
// que es como PayPal recibe y devuelve los montos.
export function convertirADolares(montoColones) {
  return (Math.round((montoColones / configuracionPayPal.tipoCambioDolar) * 100) / 100).toFixed(2);
}

// Crea la orden. huella identifica la selección (ver servicioCompra) y se guarda en custom_id
// para comprobar al capturar que la orden corresponde a lo que se va a vender.
export async function crearOrden({ montoDolares, huella, descripcion }) {
  const respuesta = await peticion('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ custom_id: huella, description: descripcion, amount: { currency_code: MONEDA, value: montoDolares } }],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Cine Aurora',
          shipping_preference: 'NO_SHIPPING', // boletos digitales: no se pide dirección
          user_action: 'PAY_NOW',
        },
      },
    },
  });
  if (!respuesta.ok || !respuesta.datos?.id) {
    throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL);
  }
  return respuesta.datos.id;
}

// Estado, huella y monto de una orden
export async function consultarOrden(idOrden) {
  const respuesta = await peticion('GET', `/v2/checkout/orders/${encodeURIComponent(idOrden)}`);
  if (respuesta.estadoHttp === 404) {
    throw new ErrorPagoRechazado(MENSAJE_PAYPAL_NO_COMPLETADO);
  }
  if (!respuesta.ok) {
    throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL);
  }

  const unidad = respuesta.datos.purchase_units?.[0];
  return {
    estado: respuesta.datos.status,
    huella: unidad?.custom_id ?? null,
    moneda: unidad?.amount?.currency_code ?? null,
    montoDolares: unidad?.amount?.value ?? null,
    captura: unidad?.payments?.captures?.[0] ?? null,
  };
}

function resultadoCaptura(captura) {
  if (captura?.status === ESTADO_COMPLETADO) {
    return { idPago: captura.id, referencia: captura.id };
  }
  return null;
}

// Cobra la orden aprobada. Devuelve { idPago, referencia } (idPago es el id de la captura, que
// sirve para reembolsar). Lanza ErrorPagoRechazado si PayPal no la deja capturar.
export async function capturarOrden(idOrden) {
  let respuesta;
  try {
    respuesta = await peticion('POST', `/v2/checkout/orders/${encodeURIComponent(idOrden)}/capture`);
  } catch (error) {
    if (!(error instanceof ErrorPasarela)) throw error;
    respuesta = null;
  }

  if (respuesta?.ok) {
    const resultado = resultadoCaptura(respuesta.datos?.purchase_units?.[0]?.payments?.captures?.[0]);
    if (resultado) return resultado;
    // La captura existe pero no quedó completada (por ejemplo, pendiente de revisión): no se da por pagada
    throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL);
  }
  if (respuesta && CODIGOS_RECHAZO.has(respuesta.estadoHttp)) {
    throw new ErrorPagoRechazado(MENSAJE_PAYPAL_NO_COMPLETADO);
  }

  // Sin respuesta o error 5xx: no se sabe si PayPal alcanzó a capturar. Se consulta la orden.
  const orden = await consultarOrden(idOrden);
  const resultado = resultadoCaptura(orden.captura);
  if (resultado) return resultado;
  console.error(`No se pudo confirmar la captura de la orden de PayPal ${idOrden}`);
  throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL);
}

// Devuelve todo el dinero de una captura. Se usa si la compra no se pudo guardar después de capturar.
export async function reembolsarCaptura(idCaptura) {
  const respuesta = await peticion('POST', `/v2/payments/captures/${encodeURIComponent(idCaptura)}/refund`, {});
  if (!respuesta.ok) {
    throw new ErrorPasarela(MENSAJE_ERROR_PAYPAL, idCaptura);
  }
  return respuesta.datos?.id ?? null;
}

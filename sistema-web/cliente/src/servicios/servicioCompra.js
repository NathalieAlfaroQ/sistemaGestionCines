import { peticionApi } from './clienteApi.js';
import { MENSAJE_SIN_CONEXION, TIPOS_ERROR, crearError, pedir } from './servicioReserva.js';

const URL_BASE = '/api/compras';

// La tarjeta se registra directo en ONVO desde el navegador, con la llave publicable:
// el número y el CVV nunca pasan por nuestro servidor. Al servidor solo llega el id que da ONVO.
const URL_ONVO_METODOS_PAGO = 'https://api.onvopay.com/v1/payment-methods';
const LLAVE_PUBLICA_ONVO = import.meta.env.VITE_ONVO_LLAVE_PUBLICA;

export const MENSAJE_PAGO_RECHAZADO =
  'El pago no pudo ser procesado. Verifica los datos de tu tarjeta o intenta con otro método de pago.';
const MENSAJE_ERROR_PASARELA = 'No se pudo procesar el pago en este momento. Intenta de nuevo más tarde.';

// Respuestas de ONVO que se deben a los datos de la tarjeta (rechazada, inválida...)
const CODIGOS_RECHAZO_ONVO = new Set([400, 402, 422]);

// tarjeta = { titular, numero, mesVencimiento, anioVencimiento, cvv } (ver validacionesTarjeta.js)
// Devuelve el id del método de pago en ONVO.
export async function registrarTarjeta({ titular, numero, mesVencimiento, anioVencimiento, cvv }) {
  if (!LLAVE_PUBLICA_ONVO) {
    console.error('Falta VITE_ONVO_LLAVE_PUBLICA en el .env del cliente');
    throw crearError(MENSAJE_ERROR_PASARELA, TIPOS_ERROR.conexion);
  }

  let respuesta;
  try {
    // fetch directo (no peticionApi): el token de nuestra sesión no debe viajar a ONVO
    respuesta = await fetch(URL_ONVO_METODOS_PAGO, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LLAVE_PUBLICA_ONVO}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'card',
        card: { number: numero, expMonth: mesVencimiento, expYear: anioVencimiento, cvv, holderName: titular },
        billing: { name: titular, address: { country: 'CR' } },
      }),
    });
  } catch {
    throw crearError(MENSAJE_SIN_CONEXION, TIPOS_ERROR.conexion);
  }

  if (respuesta.ok) {
    const datos = await respuesta.json();
    return datos.id;
  }
  if (CODIGOS_RECHAZO_ONVO.has(respuesta.status)) {
    throw crearError(MENSAJE_PAGO_RECHAZADO, TIPOS_ERROR.rechazado);
  }
  // 401/403 (llave mal configurada) o 5xx: no es culpa de la tarjeta
  throw crearError(MENSAJE_ERROR_PASARELA, TIPOS_ERROR.conexion);
}

// compra = { idProyeccion, asientos, boletos } más
//   { idMetodoPago, guardarMetodo } para una tarjeta nueva, o { usarTarjetaGuardada: true }
// Devuelve { idFactura, total, referencia, correoEnviado, metodoGuardado }
export async function comprar(compra) {
  return await pedir(
    URL_BASE,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compra),
    },
    'No se pudo completar la compra'
  );
}

// PayPal. seleccion = { idProyeccion, asientos, boletos }
export const MENSAJE_PAYPAL_NO_COMPLETADO = 'La transacción fue cancelada o no pudo completarse.';

// Paso 1 (al presionar el botón de PayPal): el servidor crea la orden. Devuelve { idOrden }.
export async function crearOrdenPayPal(seleccion) {
  return await pedir(
    `${URL_BASE}/paypal/ordenes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seleccion),
    },
    MENSAJE_PAYPAL_NO_COMPLETADO
  );
}

// Paso 2 (el cliente aprobó en PayPal): el servidor verifica la orden y hace la compra.
// Devuelve lo mismo que comprar(): { idFactura, total, referencia, correoEnviado }
export async function capturarOrdenPayPal(idOrden, seleccion) {
  return await pedir(
    `${URL_BASE}/paypal/ordenes/${encodeURIComponent(idOrden)}/captura`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seleccion),
    },
    MENSAJE_PAYPAL_NO_COMPLETADO
  );
}

// Tarjeta guardada del cliente: { marca, ultimosDigitos, vencimiento, titular, vencida } o null
export async function obtenerMetodoPagoGuardado() {
  const { metodoPago } = await pedir(`${URL_BASE}/metodo-pago`, {}, 'No se pudo consultar tu tarjeta guardada');
  return metodoPago;
}

// Descarga el PDF de los boletos. Se pide con fetch (y no con un enlace normal) porque la
// ruta exige el token en el encabezado Authorization.
export async function descargarBoletos(idFactura) {
  let respuesta;
  try {
    respuesta = await peticionApi(`${URL_BASE}/${encodeURIComponent(idFactura)}/boletos`);
  } catch {
    throw crearError(MENSAJE_SIN_CONEXION, TIPOS_ERROR.conexion);
  }
  if (!respuesta.ok) {
    throw crearError('No se pudieron descargar los boletos. Intenta de nuevo.', TIPOS_ERROR.conexion);
  }

  const archivo = await respuesta.blob();
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `boletos-cine-aurora-${idFactura}.pdf`;
  enlace.click();
  URL.revokeObjectURL(url);
}

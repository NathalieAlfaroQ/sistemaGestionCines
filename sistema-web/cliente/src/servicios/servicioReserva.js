import { leerMensajeError, peticionApi } from './clienteApi.js';

const URL_BASE = '/api/reserva';

// Clasifica los errores para que cada pantalla sepa cómo reaccionar:
export const TIPOS_ERROR = {
  conexion: 'conexion',
  conflicto: 'conflicto',
  rechazado: 'rechazado',
  solicitud: 'solicitud',
};

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

export function crearError(mensaje, tipo) {
  const error = new Error(mensaje);
  error.tipo = tipo;
  return error;
}

function tipoSegunEstado(estado) {
  if (estado === 409) return TIPOS_ERROR.conflicto;
  if (estado === 402) return TIPOS_ERROR.rechazado;
  if (estado >= 500) return TIPOS_ERROR.conexion;
  return TIPOS_ERROR.solicitud;
}

// Hace la petición y devuelve el cuerpo JSON, o lanza un error con su tipo
export async function pedir(url, opciones, mensajePorDefecto) {
  let respuesta;
  try {
    respuesta = await peticionApi(url, opciones);
  } catch {
    // fetch solo lanza cuando no hubo respuesta: sin red, servidor caído o petición bloqueada
    throw crearError(MENSAJE_SIN_CONEXION, TIPOS_ERROR.conexion);
  }

  if (respuesta.ok) return await respuesta.json();

  const mensaje = await leerMensajeError(respuesta, mensajePorDefecto);
  throw crearError(mensaje, tipoSegunEstado(respuesta.status));
}

export async function obtenerPeliculaCartelera(idPelicula) {
  return await pedir(
    `${URL_BASE}/peliculas/${encodeURIComponent(idPelicula)}`,
    {},
    'No se pudo obtener la película'
  );
}

// fecha en formato AAAA-MM-DD
export async function obtenerHorarios(idPelicula, fecha) {
  const parametros = new URLSearchParams({ fecha });
  return await pedir(
    `${URL_BASE}/peliculas/${encodeURIComponent(idPelicula)}/proyecciones?${parametros}`,
    {},
    'No se pudieron obtener los horarios'
  );
}

export async function obtenerAsientos(idProyeccion) {
  return await pedir(
    `${URL_BASE}/proyecciones/${encodeURIComponent(idProyeccion)}/asientos`,
    {},
    'No se pudo obtener el mapa de asientos'
  );
}

// Botón Continuar: aparta los asientos por unos minutos mientras el cliente paga.
// seleccion = { asientos: [idAsiento, ...], boletos: [{ idTipoBoleto, cantidad }, ...] }
// Devuelve { total, segundosRestantes }. Si otro cliente ya tiene un asiento: error de tipo conflicto.
export async function crearReserva(idProyeccion, seleccion) {
  return await pedir(
    `${URL_BASE}/proyecciones/${encodeURIComponent(idProyeccion)}/reservas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seleccion),
    },
    'No se pudieron reservar los asientos'
  );
}

// Reserva vigente del cliente: { idProyeccion, asientos, boletos, segundosRestantes } o null si venció
export async function obtenerMiReserva() {
  const { reserva } = await pedir(`${URL_BASE}/mi-reserva`, {}, 'No se pudo consultar tu reserva');
  return reserva;
}

// Libera los asientos reservados. No lanza errores: si falla, la reserva vence sola en unos minutos.
// No usa pedir(): la respuesta es 204, sin cuerpo JSON.
export async function cancelarReserva() {
  try {
    await peticionApi(`${URL_BASE}/mi-reserva`, { method: 'DELETE' });
  } catch {
    // Sin conexión: no hay nada más que hacer
  }
}
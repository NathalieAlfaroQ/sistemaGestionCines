import { leerMensajeError, peticionApi } from './clienteApi.js';

const URL_BASE = '/api/reserva';

// Clasifica los errores para que cada pantalla sepa cómo reaccionar:
export const TIPOS_ERROR = {
  conexion: 'conexion',
  conflicto: 'conflicto',
  solicitud: 'solicitud',
};

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

function crearError(mensaje, tipo) {
  const error = new Error(mensaje);
  error.tipo = tipo;
  return error;
}

function tipoSegunEstado(estado) {
  if (estado === 409) return TIPOS_ERROR.conflicto;
  if (estado >= 500) return TIPOS_ERROR.conexion;
  return TIPOS_ERROR.solicitud;
}

// Hace la petición y devuelve el cuerpo JSON, o lanza un error con su tipo
async function pedir(url, opciones, mensajePorDefecto) {
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

// seleccion = { asientos: [idAsiento, ...], boletos: [{ idTipoBoleto, cantidad }, ...] }
export async function verificarSeleccion(idProyeccion, seleccion) {
  return await pedir(
    `${URL_BASE}/proyecciones/${encodeURIComponent(idProyeccion)}/verificacion`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seleccion),
    },
    'No se pudo verificar la selección'
  );
}
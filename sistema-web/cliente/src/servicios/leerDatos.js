import { TIPOS_ERROR } from './servicioReserva.js';

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

async function leerMensaje(respuesta, mensajePorDefecto) {
  try {
    const cuerpo = await respuesta.json();
    return cuerpo.mensaje || cuerpo.error || mensajePorDefecto;
  } catch {
    return mensajePorDefecto;
  }
}

export async function leerDatos(pedir, mensajePorDefecto) {
  let respuesta;
  try {
    respuesta = await pedir();
  } catch {
    throw crearError(MENSAJE_SIN_CONEXION, TIPOS_ERROR.conexion);
  }

  if (respuesta.ok) return await respuesta.json();

  throw crearError(await leerMensaje(respuesta, mensajePorDefecto), tipoSegunEstado(respuesta.status));
}

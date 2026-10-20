import { obtenerToken, cerrarSesion } from './sesion.js'

const RUTA_LOGIN = '/iniciar-sesion'

export async function peticionApi(url, opciones = {}) {
  const token = obtenerToken()
  const headers = { ...opciones.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const respuesta = await fetch(url, { ...opciones, headers })

  if (respuesta.status === 401) {
    cerrarSesion()
    window.location.href = RUTA_LOGIN
  }

  return respuesta
}

export async function leerMensajeError(respuesta, mensajePorDefecto) {
  try {
    const datos = await respuesta.json()
    return datos.mensaje || datos.error || mensajePorDefecto
  } catch {
    return mensajePorDefecto
  }
}
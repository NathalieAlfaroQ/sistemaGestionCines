const CLAVE_TOKEN = 'token'
const CLAVE_USUARIO = 'usuario'

export function guardarSesion(token, usuario) {
  sessionStorage.setItem(CLAVE_TOKEN, token)
  sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
}

export function obtenerToken() {
  return sessionStorage.getItem(CLAVE_TOKEN)
}

export function obtenerUsuario() {
  const texto = sessionStorage.getItem(CLAVE_USUARIO)
  if (!texto) return null

  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_TOKEN)
  sessionStorage.removeItem(CLAVE_USUARIO)
}
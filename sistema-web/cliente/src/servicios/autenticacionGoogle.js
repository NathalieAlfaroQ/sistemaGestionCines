import { leerMensajeError } from './clienteApi.js'

export async function iniciarSesionConGoogle(credencial) {
  const respuesta = await fetch('/api/iniciar-sesion-google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credencial }),
  })

  if (!respuesta.ok) {
    throw new Error(await leerMensajeError(respuesta, 'No se pudo iniciar sesión con Google'))
  }

  return respuesta.json()
}
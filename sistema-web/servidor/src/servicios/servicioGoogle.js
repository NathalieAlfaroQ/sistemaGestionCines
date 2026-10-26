import { clienteGoogle, idClienteGoogle } from '../configuracion/google.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { ErrorNoAutenticado } from '../errores/ErrorNoAutenticado.js';

export async function verificarTokenGoogle(credencial) {
  if (typeof credencial !== 'string' || credencial.trim() === '') {
    throw new ErrorValidacion('Falta la credencial de Google');
  }

  let ticket;
  try {
    ticket = await clienteGoogle.verifyIdToken({
      idToken: credencial,
      audience: idClienteGoogle,
    });
  } catch {
    throw new ErrorNoAutenticado('La credencial de Google no es válida');
  }

  const datos = ticket.getPayload();

  if (!datos.email_verified) {
    throw new ErrorNoAutenticado('El correo de Google no está verificado');
  }

  return {
    idGoogle: datos.sub,
    correo: datos.email,
    nombre: datos.given_name ?? datos.name,
    apellido: datos.family_name ?? '-',
  };
}
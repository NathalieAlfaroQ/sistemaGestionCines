import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoAutorizado } from '../errores/ErrorNoAutorizado.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorProhibido } from '../errores/ErrorProhibido.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(error, req, res, next) {
  if (error instanceof ErrorValidacion) {
    return res.status(400).json({ mensaje: error.message });
  }
  if (error instanceof ErrorNoAutorizado) {
    return res.status(401).json({ mensaje: error.message });
  }
  if (error instanceof ErrorProhibido) {
    return res.status(403).json({ mensaje: error.message });
  }
  if (error instanceof ErrorNoEncontrado) {
    return res.status(404).json({ mensaje: error.message });
  }
  if (error instanceof ErrorConflicto) {
    return res.status(409).json({ mensaje: error.message });
  }

  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ mensaje: 'Solicitud inválida' });
  }

  console.error(error);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
}
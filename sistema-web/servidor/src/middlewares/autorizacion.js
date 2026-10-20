import { ErrorProhibido } from '../errores/ErrorProhibido.js';
import { ErrorNoAutorizado } from '../errores/ErrorNoAutorizado.js';

export function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new ErrorNoAutorizado('Token de autenticación no proporcionado'));
    }

    if (!rolesPermitidos.includes(req.usuario.tipoUsuario)) {
      return next(new ErrorProhibido('No tienes permiso para realizar esta acción'));
    }

    next();
  };
}
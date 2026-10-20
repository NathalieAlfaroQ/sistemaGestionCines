import { ErrorNoAutorizado } from '../errores/ErrorNoAutorizado.js';
import { verificarToken } from '../servicios/servicioToken.js';
import { ErrorProhibido } from '../errores/ErrorProhibido.js';

export function verificarAutenticacion(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ErrorNoAutorizado('Token de autenticación no proporcionado'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new ErrorNoAutorizado('Token de autenticación inválido'));
  }

  let usuario;
  try {
    usuario = verificarToken(token);
  } catch (error) {
    const mensaje = error.name === 'TokenExpiredError'
      ? 'La sesión ha expirado'
      : 'Token de autenticación inválido';
    return next(new ErrorNoAutorizado(mensaje));
  }

  req.usuario = usuario;
  next();
}

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


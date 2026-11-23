import { verificarToken } from '../servicios/servicioToken.js';
import { consultarRecomendaciones } from '../servicios/servicioRecomendacion.js';

// La sección es pública: con una sesión válida se personaliza; sin sesión, o con una inválida o vencida,
// el visitante recibe la cartelera (a diferencia de verificarAutenticacion, aquí no se responde 401)
export function identificarUsuario(req, res, next) {
  const encabezado = req.headers.authorization;

  if (typeof encabezado === 'string' && encabezado.startsWith('Bearer ')) {
    try {
      req.usuario = verificarToken(encabezado.split(' ')[1]);
    } catch {
      req.usuario = undefined;
    }
  }
  next();
}

export async function listarRecomendaciones(req, res, next) {
  try {
    res.json(await consultarRecomendaciones(req.usuario, req.query.idSede));
  } catch (error) {
    next(error);
  }
}
import { actualizarPerfil as actualizar } from '../servicios/servicioPerfil.js';

export async function actualizarPerfil(req, res, next) {
  try {
    const cambios = await actualizar(req.usuario, req.body ?? {});
    res.json({ mensaje: 'Perfil actualizado', ...cambios });
  } catch (error) {
    next(error);
  }
}
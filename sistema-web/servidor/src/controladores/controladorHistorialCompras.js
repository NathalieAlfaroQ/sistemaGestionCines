import { consultarHistorialCompras } from '../servicios/servicioHistorialCompras.js';

export async function listarHistorialCompras(req, res, next) {
  try {
    res.json(await consultarHistorialCompras(req.usuario));
  } catch (error) {
    next(error);
  }
}
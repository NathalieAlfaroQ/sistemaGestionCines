import { consultarCartelera, consultarSedes } from '../servicios/servicioCartelera.js';

export async function listarSedes(req, res, next) {
  try {
    res.json(await consultarSedes());
  } catch (error) {
    next(error);
  }
}

export async function listarCartelera(req, res, next) {
  try {
    res.json(await consultarCartelera(req.query.idSede));
  } catch (error) {
    next(error);
  }
}

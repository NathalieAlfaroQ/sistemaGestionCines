import {
  consultarAsientos,
  consultarHorarios,
  consultarPelicula,
  verificarSeleccion,
} from '../servicios/servicioReserva.js';

export async function verPelicula(req, res, next) {
  try {
    res.json(await consultarPelicula(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function listarHorarios(req, res, next) {
  try {
    res.json(await consultarHorarios(Number(req.params.id), req.query.fecha));
  } catch (error) {
    next(error);
  }
}

export async function verAsientos(req, res, next) {
  try {
    res.json(await consultarAsientos(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function verificarAsientos(req, res, next) {
  try {
    res.json(await verificarSeleccion(Number(req.params.id), req.body));
  } catch (error) {
    next(error);
  }
}
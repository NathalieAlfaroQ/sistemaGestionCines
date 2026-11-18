import {
  cancelarReserva,
  consultarAsientos,
  consultarHorarios,
  consultarPelicula,
  consultarReserva,
  crearReserva,
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

// Botón Continuar: aparta los asientos. { total, segundosRestantes }
export async function reservarAsientos(req, res, next) {
  try {
    res.status(201).json(await crearReserva(req.usuario, Number(req.params.id), req.body));
  } catch (error) {
    next(error);
  }
}

// Reserva vigente del cliente; { reserva: null } si no tiene o ya venció
export async function verMiReserva(req, res, next) {
  try {
    res.json({ reserva: await consultarReserva(req.usuario) });
  } catch (error) {
    next(error);
  }
}

export async function cancelarMiReserva(req, res, next) {
  try {
    await cancelarReserva(req.usuario);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

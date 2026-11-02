import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { existeSedeActiva, listarCartelera, listarSedesActivas } from '../repositorios/repositorioCartelera.js';
import { obtenerUrlImagen } from './almacenamientoImagenes.js';

const formateadorCostaRica = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Costa_Rica',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const ahoraCostaRica = () => formateadorCostaRica.format(new Date());

export async function consultarSedes() {
  return await listarSedesActivas();
}

export async function consultarCartelera(idSede, ahora = ahoraCostaRica()) {
  const id = Number(idSede);

  if (idSede === undefined || idSede === null || idSede === '' || !Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion('El id de sede no es válido');
  }

  if (!(await existeSedeActiva(id))) {
    throw new ErrorNoEncontrado('La sede no existe');
  }

  const filas = await listarCartelera(id, ahora);

  return filas.map(([idPelicula, titulo, duracion, clasificacion, clavePortada, claveCarrusel]) => [
    idPelicula,
    titulo,
    duracion,
    clasificacion,
    obtenerUrlImagen(clavePortada),
    obtenerUrlImagen(claveCarrusel),
  ]);
}

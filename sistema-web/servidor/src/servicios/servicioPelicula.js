import { crearPelicula, listarPeliculas } from '../repositorios/repositorioPelicula.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { CLASIFICACIONES_VALIDAS } from '../constantes/clasificaciones.js';

export async function registrarPelicula(datos) {
  const titulo = (datos.titulo ?? '').trim();
  const sinopsis = (datos.sinopsis ?? '').trim();
  const clasificacion = (datos.clasificacion ?? '').trim();
  const duracion = Number(datos.duracion);
  const generos = Array.isArray(datos.generos) ? datos.generos : [];
  const idiomas = Array.isArray(datos.idiomas) ? datos.idiomas : [];

  if (titulo === '') throw new ErrorValidacion('El título es obligatorio');
  if (titulo.length > 100) throw new ErrorValidacion('El título no puede superar los 100 caracteres');
  if (!CLASIFICACIONES_VALIDAS.has(clasificacion)) throw new ErrorValidacion('La clasificación no es válida');
  if (!Number.isInteger(duracion) || duracion <= 0) throw new ErrorValidacion('La duración debe ser un número entero positivo');
  if (sinopsis.length > 500) throw new ErrorValidacion('La sinopsis no puede superar los 500 caracteres');
  if (generos.length === 0) throw new ErrorValidacion('Al menos un género es obligatorio');
  if (idiomas.length === 0) throw new ErrorValidacion('Al menos un idioma es obligatorio');

  return await crearPelicula({
    titulo,
    clasificacion,
    duracion,
    sinopsis: sinopsis || null,
    generos,
    idiomas,
  });
}

export async function obtenerPeliculas(busqueda) {
  return await listarPeliculas(busqueda);
}
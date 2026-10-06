import { crearPelicula, listarPeliculas, obtenerClavesImagenes, actualizarClaveImagen } from '../repositorios/repositorioPelicula.js';
import { CLASIFICACIONES_VALIDAS } from '../constantes/clasificaciones.js';
import { randomUUID } from 'node:crypto';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { procesarImagen } from './procesadorImagenes.js';
import { subirImagen, eliminarImagen, obtenerUrlImagen } from './almacenamientoImagenes.js';

const PREFIJOS_IMAGEN = new Map([
  ['poster', 'peliculas/posters'],
  ['banner', 'peliculas/banners'],
]);

const PATRON_TITULO = /^[\p{L}\p{N}\p{P}\p{Sm}\p{Sc} ]+$/u;
const PATRON_DURACION = /^\d{1,3}$/;

export async function asignarImagenPelicula(idPelicula, tipo, buffer) {
  if (!Number.isInteger(idPelicula) || idPelicula <= 0) {
    throw new ErrorValidacion('El id de la película no es válido');
  }
  if (!PREFIJOS_IMAGEN.has(tipo)) {
    throw new ErrorValidacion('El tipo de imagen debe ser poster o banner');
  }

  const clavesActuales = await obtenerClavesImagenes(idPelicula);
  if (!clavesActuales) {
    throw new ErrorNoEncontrado('La película no existe');
  }
  const [clavePoster, claveBanner] = clavesActuales;
  const claveAnterior = tipo === 'poster' ? clavePoster : claveBanner;

  const imagen = await procesarImagen(buffer, tipo);
  const claveNueva = `${PREFIJOS_IMAGEN.get(tipo)}/${randomUUID()}.${imagen.extension}`;
  await subirImagen(imagen.buffer, claveNueva, imagen.tipoContenido);

  try {
    await actualizarClaveImagen(idPelicula, tipo, claveNueva);
  } catch (error) {
    await eliminarImagen(claveNueva).catch((error_) =>
      console.error('No se pudo limpiar la imagen recién subida:', error_)
    );
    throw error;
  }

  await eliminarImagen(claveAnterior).catch((error) =>
    console.error('No se pudo borrar la imagen anterior:', error)
  );

  return obtenerUrlImagen(claveNueva);
}

export async function registrarPelicula(datos) {
  const titulo = (datos.titulo ?? '').trim();
  const sinopsis = (datos.sinopsis ?? '').trim();
  const clasificacion = (datos.clasificacion ?? '').trim();
  const duracionTexto = String(datos.duracion ?? '').trim();
  const generos = Array.isArray(datos.generos) ? datos.generos : [];
  const idiomas = Array.isArray(datos.idiomas) ? datos.idiomas : [];

  if (titulo === '') throw new ErrorValidacion('El título es obligatorio');
  if (titulo.length > 100) throw new ErrorValidacion('El título no puede superar los 100 caracteres');
  if (!PATRON_TITULO.test(titulo)) {
    throw new ErrorValidacion('El título solo admite letras, números, espacios y signos');
  }
  if (!CLASIFICACIONES_VALIDAS.has(clasificacion)) throw new ErrorValidacion('La clasificación no es válida');
  if (!PATRON_DURACION.test(duracionTexto) || Number(duracionTexto) < 1) {
    throw new ErrorValidacion('La duración debe ser un número entero entre 1 y 999');
  }
  if (sinopsis === '') throw new ErrorValidacion('La sinopsis es obligatoria');
  if (sinopsis.length > 500) throw new ErrorValidacion('La sinopsis no puede superar los 500 caracteres');
  if (generos.length === 0) throw new ErrorValidacion('Al menos un género es obligatorio');
  if (idiomas.length === 0) throw new ErrorValidacion('Al menos un idioma es obligatorio');

  return await crearPelicula({
    titulo,
    clasificacion,
    duracion: Number(duracionTexto),
    sinopsis,
    generos,
    idiomas,
  });
}

export async function obtenerPeliculas(busqueda) {
  return await listarPeliculas(busqueda);
}
import { listarPeliculas } from '../repositorios/repositorioPelicula.js';

export async function obtenerPeliculas() {
  return await listarPeliculas();
}
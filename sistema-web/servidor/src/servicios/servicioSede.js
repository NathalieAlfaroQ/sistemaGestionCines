import { listarSedes } from '../repositorios/repositorioSede.js';

export async function obtenerSedes(busqueda) {
  return await listarSedes(busqueda);
}
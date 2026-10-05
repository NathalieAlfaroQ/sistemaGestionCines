import { listarProvincias, listarCantones } from '../repositorios/repositorioUbicacion.js';

export async function obtenerUbicaciones() {
  const [provincias, cantones] = await Promise.all([listarProvincias(), listarCantones()]);
  return { provincias, cantones };
}

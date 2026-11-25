import { leerDatos } from './leerDatos.js';
import { obtenerToken } from './sesion.js';

// Mismas columnas que GET /api/cartelera;
// la lista viene vacía para un visitante o un cliente sin compras.
export function obtenerRecomendaciones(idSede) {
  const parametros = new URLSearchParams({ idSede });
  const token = obtenerToken();
  const opciones = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  return leerDatos(() => fetch(`/api/recomendaciones?${parametros}`, opciones), 'No se pudieron obtener las recomendaciones');
}
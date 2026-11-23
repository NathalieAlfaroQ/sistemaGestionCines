import { leerDatos } from './leerDatos.js';
import { obtenerToken } from './sesion.js';

// si la sesión venció, debe mostrar la cartelera en vez de llevar al inicio de sesión.
export function obtenerRecomendaciones(idSede) {
  const parametros = new URLSearchParams({ idSede });
  const token = obtenerToken();
  const opciones = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  return leerDatos(() => fetch(`/api/recomendaciones?${parametros}`, opciones), 'No se pudieron obtener las recomendaciones');
}
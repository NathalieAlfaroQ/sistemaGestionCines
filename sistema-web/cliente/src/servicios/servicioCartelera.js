import { leerDatos } from './leerDatos.js';

export function obtenerSedesCartelera() {
  return leerDatos(() => fetch('/api/cartelera/sedes'), 'No se pudieron obtener los cines');
}

export function obtenerCartelera(idSede) {
  const parametros = new URLSearchParams({ idSede });
  return leerDatos(() => fetch(`/api/cartelera?${parametros}`), 'No se pudo obtener la cartelera');
}

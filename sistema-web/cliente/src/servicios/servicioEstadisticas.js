import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';

function aConsulta(filtros) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) parametros.set(clave, valor);
  });
  const consulta = parametros.toString();
  return consulta ? `?${consulta}` : '';
}

export async function obtenerVentas(filtros = {}) {
  return await leerDatos(
    () => peticionApi(`/api/estadisticas/ventas${aConsulta(filtros)}`),
    'No se pudieron cargar las ventas, reintente después'
  );
}

export async function obtenerPeliculasMasVistas(filtros = {}) {
  return await leerDatos(
    () => peticionApi(`/api/estadisticas/peliculas-mas-vistas${aConsulta(filtros)}`),
    'No se pudo cargar la película más vista, reintente después'
  );
}

export async function obtenerRecaudacionPorPelicula(filtros = {}) {
  return await leerDatos(
    () => peticionApi(`/api/estadisticas/recaudacion-por-pelicula${aConsulta(filtros)}`),
    'No se pudo cargar la recaudación por película, reintente después'
  );
}

export async function obtenerSedesParaFiltro() {
  return await leerDatos(
    () => peticionApi('/api/estadisticas/sedes'),
    'No se pudieron cargar los cines, reintente después'
  );
}
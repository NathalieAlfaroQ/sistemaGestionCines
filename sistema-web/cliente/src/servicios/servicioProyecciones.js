import { peticionApi } from './clienteApi.js';

export async function obtenerProyecciones(filtros = {}) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) parametros.set(clave, valor);
  });

  const consulta = parametros.toString();
  const respuesta = await peticionApi(consulta ? `/api/proyecciones?${consulta}` : '/api/proyecciones');

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las proyecciones');
  }

  return await respuesta.json();
}

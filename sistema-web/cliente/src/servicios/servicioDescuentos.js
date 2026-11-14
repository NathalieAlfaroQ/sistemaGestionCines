import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';

export async function obtenerDescuentos(filtros = {}) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) parametros.set(clave, valor);
  });

  const consulta = parametros.toString();
  return await leerDatos(
    () => peticionApi(consulta ? `/api/descuentos?${consulta}` : '/api/descuentos'),
    'No se pudo cargar la lista de descuentos, reintente después'
  );
}
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

export async function crearDescuento(descuento) {
  const respuesta = await peticionApi('/api/descuentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(descuento),
  });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo crear el descuento');
  }

  return cuerpo;
}
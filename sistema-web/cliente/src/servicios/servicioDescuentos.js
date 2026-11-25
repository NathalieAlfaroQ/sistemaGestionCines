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

async function enviarDescuento(url, metodo, descuento, mensajeError) {
  const respuesta = await peticionApi(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(descuento),
  });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? mensajeError);
  }

  return cuerpo;
}

export function crearDescuento(descuento) {
  return enviarDescuento('/api/descuentos', 'POST', descuento, 'No se pudo crear el descuento');
}

export function editarDescuento(idDescuento, descuento) {
  return enviarDescuento(`/api/descuentos/${idDescuento}`, 'PUT', descuento, 'No se pudo editar el descuento');
}

export async function eliminarDescuento(idDescuento) {
  const respuesta = await peticionApi(`/api/descuentos/${idDescuento}`, { method: 'DELETE' });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo eliminar el descuento');
  }

  return cuerpo;
}
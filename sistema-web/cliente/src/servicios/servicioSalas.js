import { peticionApi } from './clienteApi.js';

export async function obtenerSalas(filtros = {}) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) parametros.set(clave, valor);
  });

  const consulta = parametros.toString();
  const respuesta = await peticionApi(consulta ? `/api/salas?${consulta}` : '/api/salas');

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las salas');
  }

  return await respuesta.json();
}

async function obtenerCatalogo(url, mensajeError) {
  const respuesta = await peticionApi(url);

  if (!respuesta.ok) {
    throw new Error(mensajeError);
  }

  return await respuesta.json();
}

export function obtenerTiposSala() {
  return obtenerCatalogo('/api/salas/tipos', 'No se pudieron obtener los tipos de sala');
}

export function obtenerFormatosSala() {
  return obtenerCatalogo('/api/salas/formatos', 'No se pudieron obtener los formatos');
}

async function leerCuerpo(respuesta) {
  return await respuesta.json().catch(() => ({}));
}

export async function eliminarSala(idSala) {
  const respuesta = await peticionApi(`/api/salas/${idSala}`, { method: 'DELETE' });

  const cuerpo = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo eliminar la sala');
  }

  return cuerpo;
}

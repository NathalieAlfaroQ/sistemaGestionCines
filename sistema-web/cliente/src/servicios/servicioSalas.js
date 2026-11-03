import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';

export async function obtenerSalas(filtros = {}) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) parametros.set(clave, valor);
  });

  const consulta = parametros.toString();
  return await leerDatos(
    () => peticionApi(consulta ? `/api/salas?${consulta}` : '/api/salas'),
    'No se pudieron obtener las salas'
  );
}

async function obtenerCatalogo(url, mensajeError) {
  return await leerDatos(() => peticionApi(url), mensajeError);
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

export function obtenerDistribucionesSala() {
  return obtenerCatalogo('/api/salas/distribuciones', 'No se pudieron obtener las distribuciones');
}

export async function crearSala(sala) {
  const respuesta = await peticionApi('/api/salas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sala),
  });

  const cuerpo = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo crear la sala');
  }

  return cuerpo;
}

export async function obtenerSala(idSala) {
  return await leerDatos(() => peticionApi(`/api/salas/${idSala}`), 'No se pudo obtener la sala');
}

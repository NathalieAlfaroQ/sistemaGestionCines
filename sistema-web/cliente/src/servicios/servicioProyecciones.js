import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';

export async function obtenerProyecciones(filtros = {}) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) parametros.set(clave, valor);
  });

  const consulta = parametros.toString();
  return await leerDatos(
    () => peticionApi(consulta ? `/api/proyecciones?${consulta}` : '/api/proyecciones'),
    'No se pudieron obtener las proyecciones'
  );
}

async function leerCuerpo(respuesta) {
  return await respuesta.json().catch(() => ({}));
}

async function enviarProyeccion(url, metodo, proyeccion, mensajeError) {
  const respuesta = await peticionApi(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proyeccion),
  });

  const cuerpo = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? mensajeError);
  }

  return cuerpo;
}

export function crearProyeccion(proyeccion) {
  return enviarProyeccion('/api/proyecciones', 'POST', proyeccion, 'No se pudo crear la proyección');
}

export async function eliminarProyeccion(idProyeccion) {
  const respuesta = await peticionApi(`/api/proyecciones/${idProyeccion}`, { method: 'DELETE' });

  const cuerpo = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo eliminar la proyección');
  }

  return cuerpo;
}

export function editarProyeccion(idProyeccion, proyeccion) {
  return enviarProyeccion(`/api/proyecciones/${idProyeccion}`, 'PUT', proyeccion, 'No se pudo editar la proyección');
}

export async function obtenerTareas() {
  return await leerDatos(() => peticionApi('/api/proyecciones/tareas'), 'No se pudieron obtener las tareas');
}

export async function obtenerTareasDeProyeccion(idProyeccion) {
  return await leerDatos(
    () => peticionApi(`/api/proyecciones/${idProyeccion}/tareas`),
    'No se pudieron obtener las tareas de la proyección'
  );
}

async function leerCuerpo(respuesta) {
  return await respuesta.json().catch(() => ({}));
}

export async function obtenerSedes(busqueda = '') {
  const url = busqueda
    ? `/api/sedes?busqueda=${encodeURIComponent(busqueda)}`
    : '/api/sedes';

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las sedes');
  }

  return await respuesta.json();
}

export async function obtenerUbicaciones() {
  const respuesta = await fetch('/api/ubicaciones');

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las provincias y cantones');
  }

  return await respuesta.json();
}

export async function crearSede(sede) {
  const respuesta = await fetch('/api/sedes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sede),
  });

  const cuerpo = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo crear la sede');
  }

  return cuerpo;
}

export async function eliminarSede(idSede) {
  const respuesta = await fetch(`/api/sedes/${idSede}`, { method: 'DELETE' });

  const cuerpo = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo eliminar la sede');
  }

  return cuerpo;
}
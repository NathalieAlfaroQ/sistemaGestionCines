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
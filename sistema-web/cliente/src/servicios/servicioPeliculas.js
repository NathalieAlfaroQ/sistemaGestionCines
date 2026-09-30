export async function obtenerPeliculas(busqueda = '') {
  const url = busqueda
    ? `/api/peliculas?busqueda=${encodeURIComponent(busqueda)}`
    : '/api/peliculas';

  const respuesta = await fetch(url);
  
  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las películas');
  }

  return await respuesta.json();
}
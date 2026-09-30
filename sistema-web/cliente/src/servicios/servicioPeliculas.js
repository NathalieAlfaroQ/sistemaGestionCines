export async function obtenerPeliculas() {
  const respuesta = await fetch('/api/peliculas');

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las películas');
  }

  return await respuesta.json();
}
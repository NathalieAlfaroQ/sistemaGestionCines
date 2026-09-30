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

export async function obtenerCatalogo() {
  const respuesta = await fetch('/api/catalogo');

  if (!respuesta.ok) {
    throw new Error('No se pudo obtener el catálogo');
  }

  return await respuesta.json();
}

export async function crearPelicula(pelicula) {
  const respuesta = await fetch('/api/peliculas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pelicula),
  });

  const cuerpo = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo crear la película');
  }

  return cuerpo;
}
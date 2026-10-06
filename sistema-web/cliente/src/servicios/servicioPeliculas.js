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

async function subirImagenPelicula(idPelicula, tipo, archivo) {
  const datos = new FormData();
  datos.append('imagen', archivo);

  const respuesta = await fetch(`/api/peliculas/${idPelicula}/imagenes/${tipo}`, {
    method: 'PUT',
    body: datos,
  });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje ?? 'No se pudo subir la imagen');
  }

  return cuerpo;
}

export async function subirImagenesPelicula(idPelicula, archivos) {
  const tipos = Object.keys(archivos);
  const resultados = await Promise.allSettled(
    tipos.map((tipo) => subirImagenPelicula(idPelicula, tipo, archivos[tipo]))
  );

  const subidas = [];
  const fallos = {};

  resultados.forEach((resultado, indice) => {
    if (resultado.status === 'fulfilled') {
      subidas.push(tipos[indice]);
    } else {
      fallos[tipos[indice]] = resultado.reason.message;
    }
  });

  return { subidas, fallos };
}
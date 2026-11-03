const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

async function pedir(url, mensajePorDefecto) {
  let respuesta;
  try {
    respuesta = await fetch(url);
  } catch {
    throw new Error(MENSAJE_SIN_CONEXION);
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(cuerpo.mensaje ?? mensajePorDefecto);
  }

  return await respuesta.json();
}

export function obtenerSedesCartelera() {
  return pedir('/api/cartelera/sedes', 'No se pudieron obtener los cines');
}

export function obtenerCartelera(idSede) {
  const parametros = new URLSearchParams({ idSede });
  return pedir(`/api/cartelera?${parametros}`, 'No se pudo obtener la cartelera');
}

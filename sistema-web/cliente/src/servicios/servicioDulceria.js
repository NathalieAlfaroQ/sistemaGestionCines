const API_URL = '/api/dulceria';

function getCredencial() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  return usuario?.idCredencial
}

export async function obtenerProductos() {
  const res = await fetch(`${API_URL}/listar?idCredencial=${getCredencial()}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al cargar productos')
  return data
}

export async function crearProducto(datos) {
  const res = await fetch(`${API_URL}/crear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, idCredencial: getCredencial() })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al crear producto')
  return data
}

export async function editarProducto(idCantidadProducto, datos) {
  const res = await fetch(`${API_URL}/editar/${idCantidadProducto}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, idCredencial: getCredencial() })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al editar');
  return data;
}

export async function eliminarProducto(idCantidadProducto) {
  const res = await fetch(`${API_URL}/eliminar/${idCantidadProducto}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idCredencial: getCredencial() })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar');
  return data;
}
const API_URL = '/api/crear-empleado';

export async function crearUsuarioInterno(datos) {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  const res = await fetch(`${API_URL}/interno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, idCreador: usuario?.idCredencial })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear el usuario');
  return data;
}

export async function obtenerEmpleados() {
  const res = await fetch(`${API_URL}/listar`);
  if (!res.ok) throw new Error('Error al cargar los empleados');
  return await res.json();
}

export async function editarEmpleado(idEmpleado, datos) {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  
  const res = await fetch(`${API_URL}/editar/${idEmpleado}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, idCreador: usuario?.idCredencial })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al editar el usuario');
  return data;
}

export async function eliminarEmpleado(idEmpleado) {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  
  const res = await fetch(`${API_URL}/eliminar/${idEmpleado}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idCreador: usuario?.idCredencial })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar');
  return data;
}


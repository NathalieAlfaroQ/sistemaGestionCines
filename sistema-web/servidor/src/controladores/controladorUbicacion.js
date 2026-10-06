import { obtenerUbicaciones } from '../servicios/servicioUbicacion.js';

export async function listarUbicaciones(req, res) {
  try {
    const ubicaciones = await obtenerUbicaciones();
    res.json(ubicaciones);
  } catch (error) {
    console.error('Error al listar ubicaciones:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las ubicaciones' });
  }
}

import { obtenerSedes } from '../servicios/servicioSede.js';

export async function listarSedes(req, res) {
  try {
    const busqueda = req.query.busqueda || null;
    const sedes = await obtenerSedes(busqueda);
    res.json(sedes);
  } catch (error) {
    console.error('Error al listar sedes:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las sedes' });
  }
}

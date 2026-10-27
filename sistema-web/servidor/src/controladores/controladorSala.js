import { obtenerSalas } from '../servicios/servicioSala.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

export async function listarSalas(req, res) {
  try {
    const { busqueda, idSede, estado } = req.query;
    const salas = await obtenerSalas({ busqueda, idSede, estado });
    res.json(salas);
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al listar salas:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las salas' });
  }
}

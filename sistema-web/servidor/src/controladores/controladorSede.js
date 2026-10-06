import { desactivarSede, obtenerSedes, registrarSede } from '../servicios/servicioSede.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

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

export async function crearSede(req, res) {
  try {
    const idSede = await registrarSede(req.body);
    res.status(201).json({ idSede });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al crear sede:', error);
    res.status(500).json({ mensaje: 'No se pudo crear la sede' });
  }
}

export async function eliminarSede(req, res) {
  try {
    const desactivada = await desactivarSede(req.params.id);

    if (!desactivada) {
      return res.status(404).json({ mensaje: 'La sede no existe o ya fue eliminada' });
    }

    res.json({ idSede: Number(req.params.id) });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al eliminar sede:', error);
    res.status(500).json({ mensaje: 'No se pudo eliminar la sede' });
  }
}
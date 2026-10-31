import { desactivarProyeccion, obtenerProyecciones, registrarProyeccion } from '../servicios/servicioProyeccion.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

export async function listarProyecciones(req, res) {
  try {
    const { busqueda, idPelicula, idSala, idSede, fecha, hora, estado } = req.query;
    const proyecciones = await obtenerProyecciones({ busqueda, idPelicula, idSala, idSede, fecha, hora, estado });
    res.json(proyecciones);
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al listar proyecciones:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las proyecciones' });
  }
}

export async function crearProyeccion(req, res) {
  try {
    const idProyeccion = await registrarProyeccion(req.body);
    res.status(201).json({ idProyeccion });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorConflicto) {
      return res.status(409).json({ mensaje: error.message });
    }
    console.error('Error al crear proyección:', error);
    res.status(500).json({ mensaje: 'No se pudo crear la proyección' });
  }
}

export async function eliminarProyeccion(req, res) {
  try {
    await desactivarProyeccion(req.params.id);
    res.json({ idProyeccion: Number(req.params.id) });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorNoEncontrado) {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error al eliminar proyección:', error);
    res.status(500).json({ mensaje: 'No se pudo eliminar la proyección' });
  }
}

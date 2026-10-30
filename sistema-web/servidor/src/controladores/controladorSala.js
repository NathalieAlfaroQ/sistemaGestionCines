import { desactivarSala, obtenerFormatos, obtenerSalas, obtenerTipos } from '../servicios/servicioSala.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

export async function listarSalas(req, res) {
  try {
    const { busqueda, idSede, idTipo, idFormato, estado } = req.query;
    const salas = await obtenerSalas({ busqueda, idSede, idTipo, idFormato, estado });
    res.json(salas);
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al listar salas:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las salas' });
  }
}

export async function listarTipos(req, res) {
  try {
    res.json(await obtenerTipos());
  } catch (error) {
    console.error('Error al listar tipos de sala:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los tipos de sala' });
  }
}

export async function listarFormatos(req, res) {
  try {
    res.json(await obtenerFormatos());
  } catch (error) {
    console.error('Error al listar formatos:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los formatos' });
  }
}

export async function eliminarSala(req, res) {
  try {
    await desactivarSala(req.params.id);
    res.json({ idSala: Number(req.params.id) });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorNoEncontrado) {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error al eliminar sala:', error);
    res.status(500).json({ mensaje: 'No se pudo eliminar la sala' });
  }
}

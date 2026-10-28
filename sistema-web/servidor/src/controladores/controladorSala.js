import { obtenerFormatos, obtenerSalas, obtenerTipos } from '../servicios/servicioSala.js';
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

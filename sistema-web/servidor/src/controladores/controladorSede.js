import { desactivarSede, modificarSede, obtenerSedes, registrarSede } from '../servicios/servicioSede.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

export async function listarSedes(req, res) {
  try {
    const { busqueda, nombre, idProvincia, idCanton, estado } = req.query;
    const sedes = await obtenerSedes({ busqueda, nombre, idProvincia, idCanton, estado });
    res.json(sedes);
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
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

export async function editarSede(req, res) {
  try {
    await modificarSede(req.params.id, req.body);
    res.json({ idSede: Number(req.params.id) });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorNoEncontrado) {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error al editar sede:', error);
    res.status(500).json({ mensaje: 'No se pudo editar la sede' });
  }
}

export async function eliminarSede(req, res) {
  try {
    await desactivarSede(req.params.id);
    res.json({ idSede: Number(req.params.id) });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorNoEncontrado) {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error al eliminar sede:', error);
    res.status(500).json({ mensaje: 'No se pudo eliminar la sede' });
  }
}
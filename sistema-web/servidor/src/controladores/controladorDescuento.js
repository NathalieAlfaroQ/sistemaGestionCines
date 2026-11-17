import { obtenerDescuentos, registrarDescuento } from '../servicios/servicioDescuento.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

export async function listarDescuentos(req, res) {
  try {
    const { busqueda, idSede, idPelicula, fechaInicio, fechaFin, estado } = req.query;
    const descuentos = await obtenerDescuentos({ busqueda, idSede, idPelicula, fechaInicio, fechaFin, estado });
    res.json(descuentos);
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al listar descuentos:', error);
    res.status(500).json({ mensaje: 'No se pudo cargar la lista de descuentos, reintente después' });
  }
}

export async function crearDescuento(req, res) {
  try {
    const idDescuento = await registrarDescuento(req.body);
    res.status(201).json({ idDescuento });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorConflicto) {
      return res.status(409).json({ mensaje: error.message });
    }
    console.error('Error al crear descuento:', error);
    res.status(500).json({ mensaje: 'No se pudo crear el descuento' });
  }
}
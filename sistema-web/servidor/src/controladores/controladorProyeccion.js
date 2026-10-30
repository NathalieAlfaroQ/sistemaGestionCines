import { obtenerProyecciones } from '../servicios/servicioProyeccion.js';
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

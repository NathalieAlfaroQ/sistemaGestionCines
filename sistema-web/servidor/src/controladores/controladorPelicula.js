import { obtenerPeliculas, registrarPelicula, asignarImagenPelicula } from '../servicios/servicioPelicula.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';

export async function crearPelicula(req, res) {
  try {
    const idPelicula = await registrarPelicula(req.body);
    res.status(200).json({ idPelicula });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al crear película:', error);
    res.status(500).json({ mensaje: 'No se pudo crear la película' });
  }
}

export async function listarPeliculas(req, res) {
  try {
    const busqueda = req.query.busqueda || null;
    const peliculas = await obtenerPeliculas(busqueda);
    res.json(peliculas);
  } catch (error) {
    console.error('Error al listar películas:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las películas' });
  }
}

export async function subirImagenPelicula(req, res) {
  try {
    const url = await asignarImagenPelicula(Number(req.params.id), req.params.tipo, req.file.buffer);
    res.json({ url });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error instanceof ErrorNoEncontrado) {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error al subir imagen de película:', error);
    res.status(500).json({ mensaje: 'No se pudo guardar la imagen' });
  }
}
import { obtenerPeliculas } from '../servicios/servicioPelicula.js';

export async function listarPeliculas(req, res) {
  try {
    const peliculas = await obtenerPeliculas();
    res.json(peliculas);
  } catch (error) {
    console.error('Error al listar películas:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener las películas' });
  }
}
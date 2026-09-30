import { obtenerGeneros, obtenerIdiomas } from '../servicios/servicioCatalogo.js';

export async function catalogo(req, res) {
  try {
    const [generos, idiomas] = await Promise.all([obtenerGeneros(), obtenerIdiomas()]);
    res.json({ generos, idiomas });
  } catch (error) {
    console.error('Error al obtener el catálogo:', error);
    res.status(500).json({ error: 'Error al obtener el catálogo' });
  }
}
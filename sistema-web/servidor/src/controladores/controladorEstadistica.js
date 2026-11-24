import {
  obtenerPeliculasMasVistas,
  obtenerRecaudacionPorPelicula,
  obtenerSedesParaFiltro,
  obtenerVentas,
} from '../servicios/servicioEstadistica.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

function responder(consulta, mensajeError) {
  return async (req, res) => {
    try {
      res.json(await consulta(req.query));
    } catch (error) {
      if (error instanceof ErrorValidacion) {
        return res.status(400).json({ mensaje: error.message });
      }
      console.error(`${mensajeError}:`, error);
      res.status(500).json({ mensaje: `${mensajeError}, reintente después` });
    }
  };
}

export const ventas = responder(({ agrupar, anio, idSede }) => obtenerVentas({ agrupar, anio, idSede }), 'No se pudieron cargar las ventas');

export const peliculasMasVistas = responder(
  ({ periodo, idSede }) => obtenerPeliculasMasVistas({ periodo, idSede }),
  'No se pudo cargar la película más vista',
);

export const recaudacionPorPelicula = responder(
  ({ periodo, idSede }) => obtenerRecaudacionPorPelicula({ periodo, idSede }),
  'No se pudo cargar la recaudación por película',
);

export const sedes = responder(() => obtenerSedesParaFiltro(), 'No se pudieron cargar los cines');
import { useEffect, useState } from 'react';
import {
  obtenerPeliculasMasVistas,
  obtenerRecaudacionPorPelicula,
  obtenerSedesParaFiltro,
  obtenerVentas,
} from '../servicios/servicioEstadisticas.js';

function useLista(cargar, dependencias) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function pedir() {
      setCargando(true);
      setError(null);

      try {
        const lista = await cargar();
        if (!cancelado) setDatos(lista);
      } catch (error) {
        if (!cancelado) {
          setDatos([]);
          setError(error);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void pedir();

    return () => {
      cancelado = true;
    };
  }, [...dependencias, intento]);

  const recargar = () => setIntento((actual) => actual + 1);

  return { datos, cargando, error, recargar };
}

export function useVentas({ agrupar, anio, idSede }) {
  const { datos, ...estado } = useLista(() => obtenerVentas({ agrupar, anio, idSede }), [agrupar, anio, idSede]);
  return { ventas: datos, ...estado };
}

export function usePeliculasMasVistas({ periodo, idSede }) {
  const { datos, ...estado } = useLista(() => obtenerPeliculasMasVistas({ periodo, idSede }), [periodo, idSede]);
  return { ranking: datos, ...estado };
}

export function useRecaudacionPorPelicula({ periodo, idSede }) {
  const { datos, ...estado } = useLista(() => obtenerRecaudacionPorPelicula({ periodo, idSede }), [periodo, idSede]);
  return { ranking: datos, ...estado };
}

export function useSedesParaFiltro() {
  const { datos, ...estado } = useLista(() => obtenerSedesParaFiltro(), []);
  return { sedes: datos, ...estado };
}
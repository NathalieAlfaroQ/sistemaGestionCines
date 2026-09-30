import { useEffect, useState } from 'react';
import { obtenerPeliculas } from '../servicios/servicioPeliculas.js';

export function usePeliculas(busqueda) {
  const [peliculas, setPeliculas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerPeliculas(busqueda);
        if (!cancelado) setPeliculas(datos);
      } catch (error) {
        if (!cancelado) setError(error.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [busqueda]);

  return { peliculas, cargando, error };
}
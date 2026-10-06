import { useEffect, useState } from 'react';
import { obtenerPelicula } from '../servicios/servicioPeliculas.js';

export function usePelicula(id) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerPelicula(id);
        if (!cancelado) setDetalle(datos);
      } catch (error_) {
        if (!cancelado) setError(error_.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [id]);

  return { detalle, cargando, error };
}
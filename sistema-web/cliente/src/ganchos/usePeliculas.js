import { useEffect, useState } from 'react';
import { obtenerPeliculas } from '../servicios/servicioPeliculas.js';

export function usePeliculas(busqueda) {
  const [peliculas, setPeliculas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerPeliculas(busqueda);
        if (!cancelado) setPeliculas(datos);
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
  }, [busqueda, version]);

  // Vuelve a pedir la lista (por ejemplo, después de borrar una película)
  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { peliculas, cargando, error, recargar };
}
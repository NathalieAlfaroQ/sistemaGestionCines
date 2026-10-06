import { useEffect, useState } from 'react';
import { obtenerSedes } from '../servicios/servicioSedes.js';

export function useSedes(busqueda) {
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerSedes(busqueda);
        if (!cancelado) setSedes(datos);
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
  }, [busqueda, version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { sedes, cargando, error, recargar };
}

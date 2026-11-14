import { useEffect, useState } from 'react';
import { obtenerDescuentos } from '../servicios/servicioDescuentos.js';

export function useDescuentos({ busqueda = '', idSede = '', idPelicula = '', fechaInicio = '', fechaFin = '' } = {}) {
  const [descuentos, setDescuentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerDescuentos({ busqueda, idSede, idPelicula, fechaInicio, fechaFin });
        if (!cancelado) setDescuentos(datos);
      } catch (error) {
        if (!cancelado) setError(error);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [busqueda, idSede, idPelicula, fechaInicio, fechaFin, version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { descuentos, cargando, error, recargar };
}
import { useEffect, useState } from 'react';
import { obtenerSalas } from '../servicios/servicioSalas.js';

export function useSalas({ busqueda = '', idSede = '', idTipo = '', idFormato = '', estado = 'activas' } = {}) {
  const [salas, setSalas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerSalas({ busqueda, idSede, idTipo, idFormato, estado });
        if (!cancelado) setSalas(datos);
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
  }, [busqueda, idSede, idTipo, idFormato, estado, version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { salas, cargando, error, recargar };
}

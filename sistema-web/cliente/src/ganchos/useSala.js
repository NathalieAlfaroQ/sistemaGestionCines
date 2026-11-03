import { useEffect, useState } from 'react';
import { obtenerSala } from '../servicios/servicioSalas.js';

export function useSala(idSala) {
  const [sala, setSala] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerSala(idSala);
        if (vigente) setSala(datos);
      } catch (error) {
        if (vigente) setError(error);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    void cargar();

    return () => {
      vigente = false;
    };
  }, [idSala, version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { sala, cargando, error, recargar };
}

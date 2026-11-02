import { useEffect, useState } from 'react';
import { obtenerSala } from '../servicios/servicioSalas.js';

export function useSala(idSala) {
  const [sala, setSala] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerSala(idSala);
        if (vigente) setSala(datos);
      } catch (error) {
        if (vigente) setError(error.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    void cargar();

    return () => {
      vigente = false;
    };
  }, [idSala]);

  return { sala, cargando, error };
}

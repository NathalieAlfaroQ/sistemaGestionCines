import { useEffect, useState } from 'react';
import { obtenerUbicaciones } from '../servicios/servicioSedes.js';

export function useUbicaciones() {
  const [ubicaciones, setUbicaciones] = useState({ provincias: [], cantones: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await obtenerUbicaciones();
        setUbicaciones(datos);
      } catch (error) {
        console.error('No se pudieron cargar las ubicaciones:', error);
        setError(error.message);
      } finally {
        setCargando(false);
      }
    }

    void cargar();
  }, []);

  return { ubicaciones, cargando, error };
}
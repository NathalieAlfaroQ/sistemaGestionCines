import { useEffect, useState } from 'react';
import { obtenerPeliculas } from '../servicios/servicioPeliculas.js';

export function usePeliculas() {
  const [peliculas, setPeliculas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await obtenerPeliculas();
        setPeliculas(datos);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    }

    void cargar();
  }, []);

  return { peliculas, cargando, error };
}
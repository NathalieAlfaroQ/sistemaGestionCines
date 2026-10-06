import { useEffect, useState } from 'react';
import { obtenerCatalogo } from '../servicios/servicioPeliculas.js';

export function useCatalogo() {
  const [catalogo, setCatalogo] = useState({ generos: [], idiomas: [], clasificaciones: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await obtenerCatalogo();
        setCatalogo(datos);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    }

    void cargar();
  }, []);

  return { catalogo, cargando, error };
}
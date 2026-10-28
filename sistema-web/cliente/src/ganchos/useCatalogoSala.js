import { useEffect, useState } from 'react';
import { obtenerFormatosSala, obtenerTiposSala } from '../servicios/servicioSalas.js';

// Listas de tipos y formatos de sala para los filtros y los formularios
export function useCatalogoSala() {
  const [tipos, setTipos] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [listaTipos, listaFormatos] = await Promise.all([obtenerTiposSala(), obtenerFormatosSala()]);
        setTipos(listaTipos);
        setFormatos(listaFormatos);
      } catch (error) {
        console.error('No se pudieron cargar los catálogos de sala:', error);
        setError(error.message);
      }
    }

    void cargar();
  }, []);

  return { tipos, formatos, error };
}

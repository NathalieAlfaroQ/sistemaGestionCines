import { useEffect, useState } from 'react';
import { obtenerDistribucionesSala, obtenerFormatosSala, obtenerTiposSala } from '../servicios/servicioSalas.js';

// Listas de tipos, formatos y distribuciones de sala para los filtros y los formularios
export function useCatalogoSala() {
  const [tipos, setTipos] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [distribuciones, setDistribuciones] = useState([]);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    async function cargar() {
      setError(null);

      try {
        const [listaTipos, listaFormatos, listaDistribuciones] = await Promise.all([
          obtenerTiposSala(),
          obtenerFormatosSala(),
          obtenerDistribucionesSala(),
        ]);
        setTipos(listaTipos);
        setFormatos(listaFormatos);
        setDistribuciones(listaDistribuciones);
      } catch (error) {
        console.error('No se pudieron cargar los catálogos de sala:', error);
        setError(error);
      }
    }

    void cargar();
  }, [version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { tipos, formatos, distribuciones, error, recargar };
}

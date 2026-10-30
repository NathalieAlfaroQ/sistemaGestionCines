import { useEffect, useState } from 'react';
import { obtenerProyecciones } from '../servicios/servicioProyecciones.js';

export function useProyecciones({
  busqueda = '',
  idPelicula = '',
  idSala = '',
  idSede = '',
  fecha = '',
  hora = '',
  estado = 'activas',
} = {}) {
  const [proyecciones, setProyecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerProyecciones({ busqueda, idPelicula, idSala, idSede, fecha, hora, estado });
        if (!cancelado) setProyecciones(datos);
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
  }, [busqueda, idPelicula, idSala, idSede, fecha, hora, estado, version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { proyecciones, cargando, error, recargar };
}

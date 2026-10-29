import { useCallback, useEffect, useState } from 'react';

export function useConsulta(consultar) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const resultado = await consultar();
        if (!cancelado) setDatos(resultado);
      } catch (error_) {
        if (!cancelado) setError(error_);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [consultar, version]);

  const recargar = useCallback(() => setVersion((anterior) => anterior + 1), []);

  return { datos, cargando, error, recargar };
}
import { useEffect, useState } from 'react';

export function useConsulta(pedir, dependencias, valorInicial) {
  const claves = dependencias ?? [pedir];
  const [datos, setDatos] = useState(valorInicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const respuesta = await pedir();
        if (vigente) setDatos(respuesta);
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

  }, [...claves, version]);

  function recargar() {
    setVersion((anterior) => anterior + 1);
  }

  return { datos, cargando, error, recargar };
}

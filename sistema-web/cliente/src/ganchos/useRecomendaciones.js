import { useCallback, useEffect, useState } from 'react';
import { obtenerRecomendaciones } from '../servicios/servicioRecomendaciones.js';

const SIN_PELICULAS = [];

// Recomendaciones para el cine elegido; idSede vacío = todavía no hay cine y no se consulta nada
export function useRecomendaciones(idSede) {
  const [estado, setEstado] = useState({ peliculas: SIN_PELICULAS, cargando: idSede !== '', error: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (idSede === '') return undefined;

    let vigente = true;
    setEstado({ peliculas: SIN_PELICULAS, cargando: true, error: null });

    obtenerRecomendaciones(idSede)
      .then((peliculas) => vigente && setEstado({ peliculas, cargando: false, error: null }))
      .catch((error) => vigente && setEstado({ peliculas: SIN_PELICULAS, cargando: false, error }));

    return () => {
      vigente = false;
    };
  }, [idSede, intento]);

  const recargar = useCallback(() => setIntento((cuenta) => cuenta + 1), []);

  return { ...estado, recargar };
}
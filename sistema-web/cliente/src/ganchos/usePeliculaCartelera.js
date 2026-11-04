import { useCallback } from 'react';
import { obtenerPeliculaCartelera } from '../servicios/servicioReserva.js';
import { useConsulta } from './useConsulta.js';

export function usePeliculaCartelera(idPelicula) {
  const consultar = useCallback(
    () => (idPelicula ? obtenerPeliculaCartelera(idPelicula) : Promise.resolve(null)),
    [idPelicula]
  );
  const { datos, cargando, error, recargar } = useConsulta(consultar);

  return { detalle: datos, cargando, error, recargar };
}
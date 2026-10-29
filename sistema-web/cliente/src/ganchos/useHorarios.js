import { useCallback } from 'react';
import { obtenerHorarios } from '../servicios/servicioReserva.js';
import { useConsulta } from './useConsulta.js';

// Arreglo vacío fijo: un [] nuevo en cada render haría creer a React que los datos cambiaron
const SIN_HORARIOS = [];

// Horarios vigentes de la película en un día (fecha en formato AAAA-MM-DD)
export function useHorarios(idPelicula, fecha) {
  const consultar = useCallback(() => obtenerHorarios(idPelicula, fecha), [idPelicula, fecha]);
  const { datos, cargando, error, recargar } = useConsulta(consultar);

  return { horarios: datos ?? SIN_HORARIOS, cargando, error, recargar };
}
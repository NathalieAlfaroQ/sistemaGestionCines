import { useCallback } from 'react';
import { obtenerAsientos } from '../servicios/servicioReserva.js';
import { useConsulta } from './useConsulta.js';

const SIN_ELEMENTOS = [];

// Datos de la función, mapa de asientos y tipos de boleto
export function useMapaAsientos(idProyeccion) {
  const consultar = useCallback(() => obtenerAsientos(idProyeccion), [idProyeccion]);
  const { datos, cargando, error, recargar } = useConsulta(consultar);

  return {
    proyeccion: datos?.proyeccion ?? null,
    asientos: datos?.asientos ?? SIN_ELEMENTOS,
    tiposBoleto: datos?.tiposBoleto ?? SIN_ELEMENTOS,
    cargando,
    error,
    recargar,
  };
}
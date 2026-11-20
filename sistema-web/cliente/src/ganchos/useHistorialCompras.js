import { obtenerHistorialCompras } from '../servicios/servicioHistorialCompras.js';
import { useConsulta } from './useConsulta.js';

export function useHistorialCompras() {
  const { datos, cargando, error, recargar } = useConsulta(obtenerHistorialCompras, [], []);

  return { compras: datos, cargando, error, recargar };
}
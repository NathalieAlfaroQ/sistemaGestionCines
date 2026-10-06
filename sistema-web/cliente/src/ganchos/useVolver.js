import { useLocation, useNavigate } from 'react-router-dom';

// Vuelve a la página anterior. Si la página se abrió directamente (sin historial en la app),
// va a "rutaPorDefecto" en vez de salirse del sitio.
export function useVolver(rutaPorDefecto) {
  const navegar = useNavigate();
  const ubicacion = useLocation();

  return function volver() {
    void navegar(ubicacion.key === 'default' ? rutaPorDefecto : -1);
  };
}
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CLAVE = 'compraEnCurso';

function leerGuardada() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}

function esValida(compra) {
  return (
    Number.isInteger(compra?.idProyeccion) &&
    Array.isArray(compra.asientos) &&
    compra.asientos.length > 0 &&
    Array.isArray(compra.boletos)
  );
}

// Devuelve { idProyeccion, asientos, boletos, etiquetas } o null si no hay compra en curso
export function useCompraEnCurso() {
  const { state } = useLocation();
  const compra = esValida(state) ? state : leerGuardada();

  useEffect(() => {
    if (esValida(state)) sessionStorage.setItem(CLAVE, JSON.stringify(state));
  }, [state]);

  return esValida(compra) ? compra : null;
}

// Al terminar la compra la selección ya no sirve (esos asientos ya están vendidos)
export function terminarCompraEnCurso() {
  sessionStorage.removeItem(CLAVE);
}

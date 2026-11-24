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

// Al terminar o abandonar la compra la selección ya no sirve (vendidos o liberados)
export function terminarCompraEnCurso() {
  sessionStorage.removeItem(CLAVE);
}

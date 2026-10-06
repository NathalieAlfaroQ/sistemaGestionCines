import { useState } from 'react';

const TAMANO_INICIAL = 8;

// Divide una lista en páginas. "reiniciarCon" es un valor (por ejemplo, la búsqueda):
// cuando cambia, se vuelve a la primera página.
export function usePaginacion(elementos, reiniciarCon) {
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(TAMANO_INICIAL);
  const [reinicioAnterior, setReinicioAnterior] = useState(reiniciarCon);

  if (reinicioAnterior !== reiniciarCon) {
    setReinicioAnterior(reiniciarCon);
    setPagina(1);
  }

  const total = elementos.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  // Si la lista se acorta, evita quedarse en una página que ya no existe
  const paginaActual = Math.min(pagina, totalPaginas);
  const indiceInicio = (paginaActual - 1) * tamano;
  const visibles = elementos.slice(indiceInicio, indiceInicio + tamano);

  function cambiarTamano(nuevoTamano) {
    setTamano(nuevoTamano);
    setPagina(1);
  }

  return {
    visibles,
    paginaActual,
    totalPaginas,
    tamano,
    total,
    desde: total === 0 ? 0 : indiceInicio + 1,
    hasta: indiceInicio + visibles.length,
    cambiarPagina: setPagina,
    cambiarTamano,
  };
}
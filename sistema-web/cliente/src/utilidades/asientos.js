export function nombreFila(indice) {
  const letra = String.fromCodePoint(65 + (indice % 26));
  return indice < 26 ? letra : nombreFila(Math.floor(indice / 26) - 1) + letra;
}

export function generarAsientos(filas, columnas) {
  return Array.from({ length: filas * columnas }, (_, i) => [i + 1, nombreFila(Math.floor(i / columnas)), (i % columnas) + 1, 0]);
}

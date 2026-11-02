export function nombreFila(indice) {
  let numero = indice + 1;
  let nombre = '';
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    nombre = String.fromCodePoint(65 + resto) + nombre;
    numero = Math.floor((numero - 1) / 26);
  }
  return nombre;
}

export function generarAsientos(filas, columnas) {
  const asientos = [];
  for (let fila = 0; fila < filas; fila++) {
    for (let numero = 1; numero <= columnas; numero++) {
      asientos.push([asientos.length + 1, nombreFila(fila), numero, 0]);
    }
  }
  return asientos;
}

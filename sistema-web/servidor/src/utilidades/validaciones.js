import { ErrorValidacion } from '../errores/ErrorValidacion.js';

// Identificador obligatorio
export function idObligatorio(valor, mensaje) {
  const id = Number(valor);

  if (valor === undefined || valor === null || valor === '' || !Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion(mensaje);
  }
  return id;
}

// Identificador de un filtro opcional
export function idDeFiltro(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') return null;

  return idObligatorio(valor, `El filtro de ${nombreCampo} no es válido`);
}

// Los datos de un formulario deben ser un objeto
export function exigirObjeto(datos, mensaje) {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorValidacion(mensaje);
  }
}

// Valor de base de datos para el filtro de estado
export function estadoDeFiltro(estado, estadosValidos) {
  if (!Object.hasOwn(estadosValidos, estado)) {
    throw new ErrorValidacion('El filtro de estado no es válido');
  }
  return estadosValidos[estado];
}

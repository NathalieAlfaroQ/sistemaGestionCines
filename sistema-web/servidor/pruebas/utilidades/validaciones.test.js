import { describe, it, expect } from 'vitest';
import { estadoDeFiltro, exigirObjeto, idDeFiltro, idObligatorio } from '../../src/utilidades/validaciones.js';
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js';

function capturarError(funcion) {
  try {
    funcion();
  } catch (error) {
    return error;
  }
  return null;
}

describe('idObligatorio', () => {
  it('devuelve el id como número, también cuando llega como texto', () => {
    expect(idObligatorio(7, 'Mensaje')).toBe(7);
    expect(idObligatorio('12', 'Mensaje')).toBe(12);
  });

  it.each([undefined, null, '', 0, -3, 1.5, 'abc', NaN])('rechaza %s con el mensaje dado', (valor) => {
    const error = capturarError(() => idObligatorio(valor, 'El cine es obligatorio'));

    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(error.message).toBe('El cine es obligatorio');
  });
});

describe('idDeFiltro', () => {
  it.each([undefined, null, ''])('devuelve null si el filtro no se envió (%s)', (valor) => {
    expect(idDeFiltro(valor, 'cine')).toBeNull();
  });

  it('devuelve el id como número', () => {
    expect(idDeFiltro('4', 'cine')).toBe(4);
  });

  it.each(['abc', 0, -1, 2.5])('rechaza %s con el nombre del filtro', (valor) => {
    const error = capturarError(() => idDeFiltro(valor, 'cine'));

    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(error.message).toBe('El filtro de cine no es válido');
  });
});

describe('exigirObjeto', () => {
  it('acepta un objeto', () => {
    expect(capturarError(() => exigirObjeto({ nombre: 'Sala 1' }, 'Mensaje'))).toBeNull();
  });

  it.each([null, undefined, [], 'texto', 5])('rechaza %s con el mensaje dado', (datos) => {
    const error = capturarError(() => exigirObjeto(datos, 'Los datos no son válidos'));

    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(error.message).toBe('Los datos no son válidos');
  });
});

describe('estadoDeFiltro', () => {
  const ESTADOS = { activas: 1, eliminadas: 0, todas: null };

  it('devuelve el valor de base de datos de cada estado', () => {
    expect(estadoDeFiltro('activas', ESTADOS)).toBe(1);
    expect(estadoDeFiltro('eliminadas', ESTADOS)).toBe(0);
    expect(estadoDeFiltro('todas', ESTADOS)).toBeNull();
  });

  it.each(['otro', '', 'toString', undefined])('rechaza el estado %s', (estado) => {
    const error = capturarError(() => estadoDeFiltro(estado, ESTADOS));

    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(error.message).toBe('El filtro de estado no es válido');
  });
});

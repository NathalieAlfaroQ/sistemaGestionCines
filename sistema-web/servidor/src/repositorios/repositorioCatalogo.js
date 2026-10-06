import { ejecutar } from '../configuracion/baseDatos.js';

// Orden de columnas: 0: ID, 1: NOMBRE
const sqlListarGeneros = `SELECT ID_GENERO, NOMBRE_GENERO FROM GENEROS ORDER BY NOMBRE_GENERO`;
const sqlListarIdiomas = `SELECT ID_IDIOMA, NOMBRE_IDIOMA FROM IDIOMAS ORDER BY NOMBRE_IDIOMA`;

export async function listarGeneros() {
  const resultado = await ejecutar(sqlListarGeneros);
  return resultado.rows;
}

export async function listarIdiomas() {
  const resultado = await ejecutar(sqlListarIdiomas);
  return resultado.rows;
}
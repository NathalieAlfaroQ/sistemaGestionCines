import { ejecutar } from '../configuracion/baseDatos.js';

const sqlListarProvincias = `
  SELECT ID_PROVINCIA, NOMBRE_PROVINCIA
  FROM PROVINCIAS
  ORDER BY NOMBRE_PROVINCIA
`;

const sqlListarCantones = `
  SELECT ID_CANTON, NOMBRE_CANTON, ID_PROVINCIA
  FROM CANTONES
  ORDER BY NOMBRE_CANTON
`;

export async function listarProvincias() {
  const resultado = await ejecutar(sqlListarProvincias);
  return resultado.rows;
}

export async function listarCantones() {
  const resultado = await ejecutar(sqlListarCantones);
  return resultado.rows;
}

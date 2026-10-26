import { ejecutar } from '../configuracion/baseDatos.js';

// Orden de columnas: 0: ID_CREDENCIAL_GOOGLE, 1: ID_CLIENTE
const sqlBuscarPorIdGoogle = `
  SELECT ID_CREDENCIAL_GOOGLE, ID_CLIENTE
  FROM CREDENCIALES_GOOGLE
  WHERE ID_GOOGLE = :idGoogle`;

export async function buscarPorIdGoogle(idGoogle) {
  const resultado = await ejecutar(sqlBuscarPorIdGoogle, { idGoogle });
  return resultado.rows[0] ?? null;
}
import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

// Orden de las columnas que recibe el frontend:
// 0: ID_SEDE, 1: NOMBRE_SEDE, 2: NOMBRE_CANTON, 3: NOMBRE_PROVINCIA
const sqlListarSedes = `
  SELECT s.ID_SEDE,
    s.NOMBRE_SEDE,
    c.NOMBRE_CANTON,
    p.NOMBRE_PROVINCIA
  FROM SEDES s
  JOIN CANTONES c   ON c.ID_CANTON = s.ID_CANTON
  JOIN PROVINCIAS p ON p.ID_PROVINCIA = c.ID_PROVINCIA
  WHERE :busqueda IS NULL
    OR UPPER(s.NOMBRE_SEDE)      LIKE '%' || UPPER(:busqueda) || '%'
    OR UPPER(c.NOMBRE_CANTON)    LIKE '%' || UPPER(:busqueda) || '%'
    OR UPPER(p.NOMBRE_PROVINCIA) LIKE '%' || UPPER(:busqueda) || '%'
  ORDER BY s.NOMBRE_SEDE
`;

export async function listarSedes(busqueda = null) {
  const resultado = await ejecutar(sqlListarSedes, { busqueda });
  return resultado.rows;
}
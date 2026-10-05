import oracledb from 'oracledb';
import { ejecutar } from '../configuracion/baseDatos.js';

const sqlCrearSede = `
  INSERT INTO SEDES (NOMBRE_SEDE, ID_CANTON)
  VALUES (:nombre, :idCanton)
  RETURNING ID_SEDE INTO :idSede
`;

const sqlExisteCanton = `SELECT 1 FROM CANTONES WHERE ID_CANTON = :idCanton`;


export async function crearSede({ nombre, idCanton }) {
  const resultado = await ejecutar(sqlCrearSede, {
    nombre,
    idCanton,
    idSede: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  });

  return resultado.outBinds.idSede[0];
}

export async function existeCanton(idCanton) {
  const resultado = await ejecutar(sqlExisteCanton, { idCanton });
  return resultado.rows.length > 0;
}

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


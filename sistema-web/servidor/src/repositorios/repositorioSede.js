import oracledb from 'oracledb';
import { ejecutar } from '../configuracion/baseDatos.js';


const sqlListarSedes = `
  SELECT s.ID_SEDE,
    s.NOMBRE_SEDE,
    c.NOMBRE_CANTON,
    p.NOMBRE_PROVINCIA,
    s.ESTADO_SEDE,
    s.ID_CANTON,
    p.ID_PROVINCIA
  FROM SEDES s
  JOIN CANTONES c   ON c.ID_CANTON = s.ID_CANTON
  JOIN PROVINCIAS p ON p.ID_PROVINCIA = c.ID_PROVINCIA
  WHERE (:estado IS NULL OR s.ESTADO_SEDE = :estado)
    AND (:idProvincia IS NULL OR p.ID_PROVINCIA = :idProvincia)
    AND (:idCanton IS NULL OR c.ID_CANTON = :idCanton)
    AND (:nombre IS NULL OR UPPER(s.NOMBRE_SEDE) LIKE '%' || UPPER(:nombre) || '%')
    AND (
      :busqueda IS NULL
      OR UPPER(s.NOMBRE_SEDE)      LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(c.NOMBRE_CANTON)    LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(p.NOMBRE_PROVINCIA) LIKE '%' || UPPER(:busqueda) || '%'
    )
  ORDER BY s.NOMBRE_SEDE
`;

const sqlCrearSede = `
  INSERT INTO SEDES (NOMBRE_SEDE, ID_CANTON, ESTADO_SEDE)
  VALUES (:nombre, :idCanton, 1)
  RETURNING ID_SEDE INTO :idSede
`;

// Solo se pueden editar las sedes activas
const sqlActualizarSede = `
  UPDATE SEDES
  SET NOMBRE_SEDE = :nombre, ID_CANTON = :idCanton
  WHERE ID_SEDE = :idSede AND ESTADO_SEDE = 1
`;

const sqlDesactivarSede = `UPDATE SEDES SET ESTADO_SEDE = 0 WHERE ID_SEDE = :idSede AND ESTADO_SEDE = 1`;

const sqlExisteCanton = `SELECT 1 FROM CANTONES WHERE ID_CANTON = :idCanton`;

export async function listarSedes({
  busqueda = null,
  nombre = null,
  idProvincia = null,
  idCanton = null,
  estado = null,
} = {}) {
  const resultado = await ejecutar(sqlListarSedes, { busqueda, nombre, idProvincia, idCanton, estado });
  return resultado.rows;
}

export async function crearSede({ nombre, idCanton }) {
  const resultado = await ejecutar(sqlCrearSede, {
    nombre,
    idCanton,
    idSede: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  });

  return resultado.outBinds.idSede[0];
}

export async function actualizarSede({ idSede, nombre, idCanton }) {
  const resultado = await ejecutar(sqlActualizarSede, { nombre, idCanton, idSede });
  return resultado.rowsAffected > 0;
}

export async function existeCanton(idCanton) {
  const resultado = await ejecutar(sqlExisteCanton, { idCanton });
  return resultado.rows.length > 0;
}

export async function desactivarSede(idSede) {
  const resultado = await ejecutar(sqlDesactivarSede, { idSede });
  return resultado.rowsAffected > 0;
}
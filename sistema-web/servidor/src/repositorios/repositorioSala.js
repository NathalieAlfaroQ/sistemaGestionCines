import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

const sqlListarSalas = `
  SELECT sa.ID_SALA,
    sa.NOMBRE_SALA,
    t.NOMBRE_TIPO,
    f.NOMBRE_FORMATO,
    se.NOMBRE_SEDE,
    sa.ESTADO_SALA,
    se.ID_SEDE,
    t.ID_TIPO,
    f.ID_FORMATO
  FROM SALAS sa
  JOIN SEDES se       ON se.ID_SEDE = sa.ID_SEDE
  JOIN TIPOS_SALA t   ON t.ID_TIPO = sa.ID_TIPO
  JOIN FORMATOS f     ON f.ID_FORMATO = sa.ID_FORMATO
  WHERE (:estado IS NULL OR sa.ESTADO_SALA = :estado)
    AND (:idSede IS NULL OR se.ID_SEDE = :idSede)
    AND (:idTipo IS NULL OR t.ID_TIPO = :idTipo)
    AND (:idFormato IS NULL OR f.ID_FORMATO = :idFormato)
    AND (
      :busqueda IS NULL
      OR UPPER(sa.NOMBRE_SALA)    LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(t.NOMBRE_TIPO)     LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(f.NOMBRE_FORMATO)  LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(se.NOMBRE_SEDE)    LIKE '%' || UPPER(:busqueda) || '%'
    )
  ORDER BY se.NOMBRE_SEDE, sa.NOMBRE_SALA
`;

const sqlListarTipos = `SELECT ID_TIPO, NOMBRE_TIPO, PRECIO FROM TIPOS_SALA ORDER BY NOMBRE_TIPO`;
const sqlListarFormatos = `SELECT ID_FORMATO, NOMBRE_FORMATO, PRECIO FROM FORMATOS ORDER BY NOMBRE_FORMATO`;
const sqlListarDistribuciones = `
  SELECT ID_DISTRIBUCION, NOMBRE_DISTRIBUCION, FILAS, COLUMNAS, TOTAL_ASIENTOS
  FROM DISTRIBUCIONES_SALA
  ORDER BY TOTAL_ASIENTOS
`;

const sqlObtenerSala = `
  SELECT sa.ID_SALA,
    sa.NOMBRE_SALA,
    se.ID_SEDE,
    se.NOMBRE_SEDE,
    t.ID_TIPO,
    t.NOMBRE_TIPO,
    f.ID_FORMATO,
    f.NOMBRE_FORMATO,
    sa.MONTO,
    d.ID_DISTRIBUCION,
    d.NOMBRE_DISTRIBUCION,
    d.FILAS,
    d.COLUMNAS,
    d.TOTAL_ASIENTOS,
    sa.ESTADO_SALA
  FROM SALAS sa
  JOIN SEDES se               ON se.ID_SEDE = sa.ID_SEDE
  JOIN TIPOS_SALA t           ON t.ID_TIPO = sa.ID_TIPO
  JOIN FORMATOS f             ON f.ID_FORMATO = sa.ID_FORMATO
  JOIN DISTRIBUCIONES_SALA d  ON d.ID_DISTRIBUCION = sa.ID_DISTRIBUCION
  WHERE sa.ID_SALA = :idSala
`;

const sqlDesactivarSala = `UPDATE SALAS SET ESTADO_SALA = 0 WHERE ID_SALA = :idSala AND ESTADO_SALA = 1`;

export async function listarSalas({
  busqueda = null,
  idSede = null,
  idTipo = null,
  idFormato = null,
  estado = null,
} = {}) {
  const resultado = await ejecutar(sqlListarSalas, { busqueda, idSede, idTipo, idFormato, estado });
  return resultado.rows;
}

export async function obtenerSala(idSala) {
  const resultado = await ejecutar(sqlObtenerSala, { idSala });
  return resultado.rows[0] ?? null;
}

export async function listarTipos() {
  const resultado = await ejecutar(sqlListarTipos);
  return resultado.rows;
}

export async function listarFormatos() {
  const resultado = await ejecutar(sqlListarFormatos);
  return resultado.rows;
}

export async function desactivarSala(idSala) {
  const resultado = await ejecutar(sqlDesactivarSala, { idSala });
  return resultado.rowsAffected > 0;
}

export async function listarDistribuciones() {
  const resultado = await ejecutar(sqlListarDistribuciones);
  return resultado.rows;
}

const sqlPrecioTipo = `SELECT PRECIO FROM TIPOS_SALA WHERE ID_TIPO = :idTipo`;
const sqlPrecioFormato = `SELECT PRECIO FROM FORMATOS WHERE ID_FORMATO = :idFormato`;
const sqlDistribucion = `SELECT FILAS, COLUMNAS FROM DISTRIBUCIONES_SALA WHERE ID_DISTRIBUCION = :idDistribucion`;
const sqlExisteSedeActiva = `SELECT 1 FROM SEDES WHERE ID_SEDE = :idSede AND ESTADO_SEDE = 1`;

const sqlExisteNombreSala = `
  SELECT 1 FROM SALAS
  WHERE ID_SEDE = :idSede AND ESTADO_SALA = 1 AND UPPER(NOMBRE_SALA) = UPPER(:nombre)
`;

const sqlCrearSala = `
  INSERT INTO SALAS (ID_SEDE, ID_TIPO, NOMBRE_SALA, MONTO, ID_FORMATO, ID_DISTRIBUCION, ESTADO_SALA)
  VALUES (:idSede, :idTipo, :nombre, :monto, :idFormato, :idDistribucion, 1)
  RETURNING ID_SALA INTO :idSala
`;

const sqlCrearAsiento = `INSERT INTO ASIENTOS (ID_SALA, FILA, NUMERO) VALUES (:idSala, :fila, :numero)`;

export async function obtenerPrecioTipo(idTipo) {
  const resultado = await ejecutar(sqlPrecioTipo, { idTipo });
  return resultado.rows[0]?.[0] ?? null;
}

export async function obtenerPrecioFormato(idFormato) {
  const resultado = await ejecutar(sqlPrecioFormato, { idFormato });
  return resultado.rows[0]?.[0] ?? null;
}

export async function obtenerDistribucion(idDistribucion) {
  const resultado = await ejecutar(sqlDistribucion, { idDistribucion });
  return resultado.rows[0] ?? null;
}

export async function existeSedeActiva(idSede) {
  const resultado = await ejecutar(sqlExisteSedeActiva, { idSede });
  return resultado.rows.length > 0;
}

export async function existeNombreSala({ idSede, nombre }) {
  const resultado = await ejecutar(sqlExisteNombreSala, { idSede, nombre });
  return resultado.rows.length > 0;
}

export async function crearSalaConAsientos({ idSede, idTipo, idFormato, idDistribucion, nombre, monto, asientos }) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlCrearSala, {
      idSede,
      idTipo,
      nombre,
      monto,
      idFormato,
      idDistribucion,
      idSala: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });
    const idSala = resultado.outBinds.idSala[0];

    await conexion.executeMany(
      sqlCrearAsiento,
      asientos.map(({ fila, numero }) => ({ idSala, fila, numero })),
      {
        bindDefs: {
          idSala: { type: oracledb.NUMBER },
          fila: { type: oracledb.STRING, maxSize: 20 },
          numero: { type: oracledb.NUMBER },
        },
      },
    );

    return idSala;
  });
}

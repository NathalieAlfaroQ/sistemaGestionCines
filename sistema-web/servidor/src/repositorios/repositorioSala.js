import { ejecutar } from '../configuracion/baseDatos.js';

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

const sqlListarTipos = `SELECT ID_TIPO, NOMBRE_TIPO FROM TIPOS_SALA ORDER BY NOMBRE_TIPO`;
const sqlListarFormatos = `SELECT ID_FORMATO, NOMBRE_FORMATO FROM FORMATOS ORDER BY NOMBRE_FORMATO`;

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

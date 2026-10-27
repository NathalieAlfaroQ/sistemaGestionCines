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
    AND (
      :busqueda IS NULL
      OR UPPER(sa.NOMBRE_SALA)    LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(t.NOMBRE_TIPO)     LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(f.NOMBRE_FORMATO)  LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(se.NOMBRE_SEDE)    LIKE '%' || UPPER(:busqueda) || '%'
    )
  ORDER BY se.NOMBRE_SEDE, sa.NOMBRE_SALA
`;

export async function listarSalas({ busqueda = null, idSede = null, estado = null } = {}) {
  const resultado = await ejecutar(sqlListarSalas, { busqueda, idSede, estado });
  return resultado.rows;
}

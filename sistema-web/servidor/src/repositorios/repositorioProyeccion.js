import { ejecutar } from '../configuracion/baseDatos.js';

const sqlListarProyecciones = `
  SELECT pr.ID_PROYECCION,
    pe.TITULO,
    TO_CHAR(pr.FECHA, 'YYYY-MM-DD') AS FECHA,
    TO_CHAR(pr.FECHA, 'HH24:MI') AS HORA,
    sa.NOMBRE_SALA,
    se.NOMBRE_SEDE,
    pr.ESTADO_PROYECCION,
    pe.ID_PELICULA,
    sa.ID_SALA,
    se.ID_SEDE
  FROM PROYECCIONES pr
  JOIN PELICULAS pe ON pe.ID_PELICULA = pr.ID_PELICULA
  JOIN SALAS sa     ON sa.ID_SALA = pr.ID_SALA
  JOIN SEDES se     ON se.ID_SEDE = sa.ID_SEDE
  WHERE (:estado IS NULL OR pr.ESTADO_PROYECCION = :estado)
    AND (:idPelicula IS NULL OR pe.ID_PELICULA = :idPelicula)
    AND (:idSala IS NULL OR sa.ID_SALA = :idSala)
    AND (:idSede IS NULL OR se.ID_SEDE = :idSede)
    AND (:fecha IS NULL OR TRUNC(pr.FECHA) = TO_DATE(:fecha, 'YYYY-MM-DD'))
    AND (:hora IS NULL OR TO_CHAR(pr.FECHA, 'HH24:MI') = :hora)
    AND (
      :busqueda IS NULL
      OR UPPER(pe.TITULO)       LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(sa.NOMBRE_SALA)  LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(se.NOMBRE_SEDE)  LIKE '%' || UPPER(:busqueda) || '%'
    )
  ORDER BY pr.FECHA, se.NOMBRE_SEDE, sa.NOMBRE_SALA
`;

export async function listarProyecciones({
  busqueda = null,
  idPelicula = null,
  idSala = null,
  idSede = null,
  fecha = null,
  hora = null,
  estado = null,
} = {}) {
  const resultado = await ejecutar(sqlListarProyecciones, {
    busqueda,
    idPelicula,
    idSala,
    idSede,
    fecha,
    hora,
    estado,
  });
  return resultado.rows;
}

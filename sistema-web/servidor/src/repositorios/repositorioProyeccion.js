import oracledb from 'oracledb';
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

const sqlDuracionPelicula = `
  SELECT DURACION FROM PELICULAS WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

const sqlExisteSalaActiva = `SELECT 1 FROM SALAS WHERE ID_SALA = :idSala AND ESTADO_SALA = 1`;

// Hay choque si otra proyección activa de la sala empieza antes de que termine la nueva
// y termina después de que empiece la nueva
const sqlChoqueDeHorario = `
  SELECT 1
  FROM PROYECCIONES pr
  JOIN PELICULAS pe ON pe.ID_PELICULA = pr.ID_PELICULA
  WHERE pr.ID_SALA = :idSala
    AND pr.ESTADO_PROYECCION = 1
    AND pr.FECHA < TO_DATE(:fechaHora, 'YYYY-MM-DD HH24:MI') + :duracion / 1440
    AND pr.FECHA + pe.DURACION / 1440 > TO_DATE(:fechaHora, 'YYYY-MM-DD HH24:MI')
`;

const sqlCrearProyeccion = `
  INSERT INTO PROYECCIONES (ID_SALA, ID_PELICULA, FECHA, ESTADO_PROYECCION)
  VALUES (:idSala, :idPelicula, TO_DATE(:fechaHora, 'YYYY-MM-DD HH24:MI'), 1)
  RETURNING ID_PROYECCION INTO :idProyeccion
`;

export async function obtenerDuracionPelicula(idPelicula) {
  const resultado = await ejecutar(sqlDuracionPelicula, { idPelicula });
  return resultado.rows[0]?.[0] ?? null;
}

export async function existeSalaActiva(idSala) {
  const resultado = await ejecutar(sqlExisteSalaActiva, { idSala });
  return resultado.rows.length > 0;
}

export async function hayChoqueDeHorario({ idSala, fechaHora, duracion }) {
  const resultado = await ejecutar(sqlChoqueDeHorario, { idSala, fechaHora, duracion });
  return resultado.rows.length > 0;
}

export async function crearProyeccion({ idSala, idPelicula, fechaHora }) {
  const resultado = await ejecutar(sqlCrearProyeccion, {
    idSala,
    idPelicula,
    fechaHora,
    idProyeccion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  });

  return resultado.outBinds.idProyeccion[0];
}

const sqlDesactivarProyeccion = `
  UPDATE PROYECCIONES SET ESTADO_PROYECCION = 0
  WHERE ID_PROYECCION = :idProyeccion AND ESTADO_PROYECCION = 1
`;

export async function desactivarProyeccion(idProyeccion) {
  const resultado = await ejecutar(sqlDesactivarProyeccion, { idProyeccion });
  return resultado.rowsAffected > 0;
}

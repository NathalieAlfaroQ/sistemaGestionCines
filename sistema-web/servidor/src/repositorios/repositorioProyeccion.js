import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

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

// La duración de la película está en minutos. Solo se programan películas activas.
const sqlDuracionPelicula = `
  SELECT DURACION FROM PELICULAS WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

const sqlExisteSalaActiva = `SELECT 1 FROM SALAS WHERE ID_SALA = :idSala AND ESTADO_SALA = 1`;

const sqlChoqueDeHorario = `
  SELECT pe.TITULO,
         TO_CHAR(pr.FECHA, 'HH24:MI') AS INICIO,
         TO_CHAR(pr.FECHA + (
           pe.DURACION + NVL((SELECT SUM(tp.MINUTOS_RESERVADOS) FROM TAREAS_PROYECCION tp WHERE tp.ID_PROYECCION = pr.ID_PROYECCION), 0)
         ) / 1440, 'HH24:MI') AS FIN
  FROM PROYECCIONES pr
  JOIN PELICULAS pe ON pe.ID_PELICULA = pr.ID_PELICULA
  WHERE pr.ID_SALA = :idSala
    AND pr.ESTADO_PROYECCION = 1
    AND (:idExcluida IS NULL OR pr.ID_PROYECCION <> :idExcluida)
    AND pr.FECHA < TO_DATE(:fechaHora, 'YYYY-MM-DD HH24:MI') + :duracion / 1440
    AND pr.FECHA + (
      pe.DURACION + NVL((SELECT SUM(tp.MINUTOS_RESERVADOS) FROM TAREAS_PROYECCION tp WHERE tp.ID_PROYECCION = pr.ID_PROYECCION), 0)
    ) / 1440 > TO_DATE(:fechaHora, 'YYYY-MM-DD HH24:MI')
  ORDER BY pr.FECHA
`;

const sqlListarTareas = `SELECT ID_TAREA, NOMBRE_TAREA FROM TAREAS ORDER BY NOMBRE_TAREA`;

const sqlTareasDeProyeccion = `
  SELECT ID_TAREA, MINUTOS_RESERVADOS FROM TAREAS_PROYECCION WHERE ID_PROYECCION = :idProyeccion ORDER BY ID_TAREA
`;

const sqlCrearTareaProyeccion = `
  INSERT INTO TAREAS_PROYECCION (ID_PROYECCION, ID_TAREA, MINUTOS_RESERVADOS)
  VALUES (:idProyeccion, :idTarea, :minutos)
`;

const sqlBorrarTareasProyeccion = `DELETE FROM TAREAS_PROYECCION WHERE ID_PROYECCION = :idProyeccion`;

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

export async function buscarChoqueDeHorario({ idSala, fechaHora, duracion, idExcluida = null }) {
  const resultado = await ejecutar(sqlChoqueDeHorario, { idSala, fechaHora, duracion, idExcluida });
  if (resultado.rows.length === 0) return null;

  const [titulo, inicio, fin] = resultado.rows[0];
  return { titulo, inicio, fin };
}

export async function listarTareas() {
  const resultado = await ejecutar(sqlListarTareas);
  return resultado.rows;
}

export async function obtenerTareasDeProyeccion(idProyeccion) {
  const resultado = await ejecutar(sqlTareasDeProyeccion, { idProyeccion });
  return resultado.rows;
}

async function insertarTareas(conexion, idProyeccion, tareas) {
  if (tareas.length === 0) return;

  await conexion.executeMany(
    sqlCrearTareaProyeccion,
    tareas.map(({ idTarea, minutos }) => ({ idProyeccion, idTarea, minutos })),
    {
      bindDefs: {
        idProyeccion: { type: oracledb.NUMBER },
        idTarea: { type: oracledb.NUMBER },
        minutos: { type: oracledb.NUMBER },
      },
    },
  );
}

export async function crearProyeccion({ idSala, idPelicula, fechaHora, tareas = [] }) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlCrearProyeccion, {
      idSala,
      idPelicula,
      fechaHora,
      idProyeccion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });
    const idProyeccion = resultado.outBinds.idProyeccion[0];

    await insertarTareas(conexion, idProyeccion, tareas);

    return idProyeccion;
  });
}

const sqlDesactivarProyeccion = `
  UPDATE PROYECCIONES SET ESTADO_PROYECCION = 0
  WHERE ID_PROYECCION = :idProyeccion AND ESTADO_PROYECCION = 1
`;

export async function desactivarProyeccion(idProyeccion) {
  const resultado = await ejecutar(sqlDesactivarProyeccion, { idProyeccion });
  return resultado.rowsAffected > 0;
}

const sqlActualizarProyeccion = `
  UPDATE PROYECCIONES
  SET ID_SALA = :idSala,
      ID_PELICULA = :idPelicula,
      FECHA = TO_DATE(:fechaHora, 'YYYY-MM-DD HH24:MI')
  WHERE ID_PROYECCION = :idProyeccion AND ESTADO_PROYECCION = 1
`;

export async function actualizarProyeccion({ idProyeccion, idSala, idPelicula, fechaHora, tareas = [] }) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlActualizarProyeccion, { idProyeccion, idSala, idPelicula, fechaHora });
    if (resultado.rowsAffected === 0) return false;

    await conexion.execute(sqlBorrarTareasProyeccion, { idProyeccion });
    await insertarTareas(conexion, idProyeccion, tareas);

    return true;
  });
}

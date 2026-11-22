import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

// Un descuento está vigente si no se eliminó y su periodo no ha terminado (ahora: 'AAAA-MM-DD HH:MM', hora de Costa Rica).
// Al terminar el periodo el descuento pasa a eliminado por sí solo.
const FIN_NO_ALCANZADO = `d.FECHA_FIN > TO_DATE(:ahora, 'YYYY-MM-DD HH24:MI')`;

const sqlListarDescuentos = `
  SELECT
    d.ID_DESCUENTO,
    d.NOMBRE_DESCUENTO,
    d.PORCENTAJE,
    TO_CHAR(d.FECHA_INICIO, 'YYYY-MM-DD') AS FECHA_INICIO,
    TO_CHAR(d.FECHA_INICIO, 'HH24:MI') AS HORA_INICIO,
    TO_CHAR(d.FECHA_FIN, 'YYYY-MM-DD') AS FECHA_FIN,
    TO_CHAR(d.FECHA_FIN, 'HH24:MI') AS HORA_FIN,
    se.NOMBRE_SEDE,
    CASE WHEN d.ESTADO_DESCUENTO = 1 AND ${FIN_NO_ALCANZADO} THEN 1 ELSE 0 END AS ESTADO,
    se.ID_SEDE,
    CASE WHEN d.APLICA_TODAS = 1 THEN 'Todas' ELSE (
      SELECT LISTAGG(pe.TITULO, ', ' ON OVERFLOW TRUNCATE '...') WITHIN GROUP (ORDER BY pe.TITULO)
      FROM DESCUENTOS_PELICULA dp
      JOIN PELICULAS pe ON pe.ID_PELICULA = dp.ID_PELICULA
      WHERE dp.ID_DESCUENTO = d.ID_DESCUENTO
    ) END AS PELICULAS
  FROM DESCUENTOS d
  JOIN SEDES se ON se.ID_SEDE = d.ID_SEDE
  WHERE (:estado IS NULL OR :estado = CASE WHEN d.ESTADO_DESCUENTO = 1 AND ${FIN_NO_ALCANZADO} THEN 1 ELSE 0 END)
    AND (:idSede IS NULL OR d.ID_SEDE = :idSede)
    AND (:idPelicula IS NULL OR d.APLICA_TODAS = 1 OR EXISTS (
      SELECT 1 FROM DESCUENTOS_PELICULA dp WHERE dp.ID_DESCUENTO = d.ID_DESCUENTO AND dp.ID_PELICULA = :idPelicula
    ))
    AND (:fechaInicio IS NULL OR TRUNC(d.FECHA_INICIO) = TO_DATE(:fechaInicio, 'YYYY-MM-DD'))
    AND (:fechaFin IS NULL OR TRUNC(d.FECHA_FIN) = TO_DATE(:fechaFin, 'YYYY-MM-DD'))
    AND (
      :busqueda IS NULL
      OR UPPER(d.NOMBRE_DESCUENTO) LIKE '%' || UPPER(:busqueda) || '%'
      OR UPPER(se.NOMBRE_SEDE)     LIKE '%' || UPPER(:busqueda) || '%'
      OR EXISTS (
        SELECT 1 FROM DESCUENTOS_PELICULA dp
        JOIN PELICULAS pe ON pe.ID_PELICULA = dp.ID_PELICULA
        WHERE dp.ID_DESCUENTO = d.ID_DESCUENTO AND UPPER(pe.TITULO) LIKE '%' || UPPER(:busqueda) || '%'
      )
    )
  ORDER BY d.FECHA_INICIO, se.NOMBRE_SEDE, d.NOMBRE_DESCUENTO
`;

export async function listarDescuentos({
  ahora,
  busqueda = null,
  idSede = null,
  idPelicula = null,
  fechaInicio = null,
  fechaFin = null,
  estado = null,
} = {}) {
  const resultado = await ejecutar(sqlListarDescuentos, { ahora, busqueda, idSede, idPelicula, fechaInicio, fechaFin, estado });
  return resultado.rows;
}

const sqlExisteSedeActiva = `SELECT 1 FROM SEDES WHERE ID_SEDE = :idSede AND ESTADO_SEDE = 1`;

export async function existeSedeActiva(idSede) {
  const resultado = await ejecutar(sqlExisteSedeActiva, { idSede });
  return resultado.rows.length > 0;
}

function bindsDeIds(ids) {
  return {
    marcadores: ids.map((_, indice) => `:p${indice}`).join(', '),
    valores: Object.fromEntries(ids.map((id, indice) => [`p${indice}`, id])),
  };
}

export async function contarPeliculasActivas(idsPeliculas) {
  const { marcadores, valores } = bindsDeIds(idsPeliculas);
  const resultado = await ejecutar(
    `SELECT COUNT(*) FROM PELICULAS WHERE ESTADO_PELICULA = 1 AND ID_PELICULA IN (${marcadores})`,
    valores,
  );
  return resultado.rows[0][0];
}

// Descuento vigente del mismo cine que ya cubre alguna de las películas en un periodo que se cruza.
// Un descuento para todas las películas choca con cualquier otro del cine y periodo.
// titulo es null cuando el descuento existente aplica a todas las películas.
export async function buscarChoqueDeDescuento({ ahora, idSede, idsPeliculas, aplicaTodas = false, fechaInicio, fechaFin }) {
  const { marcadores, valores } = bindsDeIds(idsPeliculas);
  const coincidePelicula = idsPeliculas.length > 0 ? `OR dp.ID_PELICULA IN (${marcadores})` : '';
  const resultado = await ejecutar(
    `SELECT d.NOMBRE_DESCUENTO, pe.TITULO
     FROM DESCUENTOS d
     LEFT JOIN DESCUENTOS_PELICULA dp ON dp.ID_DESCUENTO = d.ID_DESCUENTO
     LEFT JOIN PELICULAS pe ON pe.ID_PELICULA = dp.ID_PELICULA
     WHERE d.ID_SEDE = :idSede
       AND d.ESTADO_DESCUENTO = 1
       AND ${FIN_NO_ALCANZADO}
       AND (:aplicaTodas = 1 OR d.APLICA_TODAS = 1 ${coincidePelicula})
       AND d.FECHA_INICIO < TO_DATE(:fechaFin, 'YYYY-MM-DD HH24:MI')
       AND d.FECHA_FIN > TO_DATE(:fechaInicio, 'YYYY-MM-DD HH24:MI')
     FETCH FIRST 1 ROWS ONLY`,
    { ahora, idSede, aplicaTodas: aplicaTodas ? 1 : 0, fechaInicio, fechaFin, ...valores },
  );
  if (resultado.rows.length === 0) return null;

  const [nombre, titulo] = resultado.rows[0];
  return { nombre, titulo };
}

const sqlCrearDescuento = `
  INSERT INTO DESCUENTOS (ID_SEDE, NOMBRE_DESCUENTO, PORCENTAJE, APLICA_TODAS, FECHA_INICIO, FECHA_FIN)
  VALUES (:idSede, :nombre, :porcentaje, :aplicaTodas,
          TO_DATE(:fechaInicio, 'YYYY-MM-DD HH24:MI'), TO_DATE(:fechaFin, 'YYYY-MM-DD HH24:MI'))
  RETURNING ID_DESCUENTO INTO :idDescuento
`;

const sqlCrearDescuentoPelicula = `
  INSERT INTO DESCUENTOS_PELICULA (ID_DESCUENTO, ID_PELICULA) VALUES (:idDescuento, :idPelicula)
`;

// Crea el descuento y sus películas (ninguna si aplica a todas) en una sola transacción
export async function crearDescuento({ idSede, nombre, porcentaje, aplicaTodas = false, fechaInicio, fechaFin, idsPeliculas = [] }) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlCrearDescuento, {
      idSede,
      nombre,
      porcentaje,
      aplicaTodas: aplicaTodas ? 1 : 0,
      fechaInicio,
      fechaFin,
      idDescuento: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });
    const idDescuento = resultado.outBinds.idDescuento[0];

    if (idsPeliculas.length === 0) return idDescuento;

    await conexion.executeMany(
      sqlCrearDescuentoPelicula,
      idsPeliculas.map((idPelicula) => ({ idDescuento, idPelicula })),
      { bindDefs: { idDescuento: { type: oracledb.NUMBER }, idPelicula: { type: oracledb.NUMBER } } },
    );

    return idDescuento;
  });
}

// Solo se eliminan los descuentos vigentes; uno vencido ya cuenta como eliminado
const sqlDesactivarDescuento = `
  UPDATE DESCUENTOS d
  SET d.ESTADO_DESCUENTO = 0
  WHERE d.ID_DESCUENTO = :idDescuento AND d.ESTADO_DESCUENTO = 1 AND ${FIN_NO_ALCANZADO}
`;

// Eliminación lógica: el descuento queda en la tabla (las facturas pueden referenciarlo). Devuelve false si no existía o ya estaba eliminado
export async function desactivarDescuento({ idDescuento, ahora }) {
  const resultado = await ejecutar(sqlDesactivarDescuento, { idDescuento, ahora });
  return resultado.rowsAffected > 0;
}
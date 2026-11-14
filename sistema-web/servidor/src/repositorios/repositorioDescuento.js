import { ejecutar } from '../configuracion/baseDatos.js';

const sqlListarDescuentos = `
  SELECT d.ID_DESCUENTO,
    d.NOMBRE_DESCUENTO,
    d.PORCENTAJE,
    TO_CHAR(d.FECHA_INICIO, 'YYYY-MM-DD') AS FECHA_INICIO,
    TO_CHAR(d.FECHA_INICIO, 'HH24:MI') AS HORA_INICIO,
    TO_CHAR(d.FECHA_FIN, 'YYYY-MM-DD') AS FECHA_FIN,
    TO_CHAR(d.FECHA_FIN, 'HH24:MI') AS HORA_FIN,
    se.NOMBRE_SEDE,
    d.ESTADO_DESCUENTO,
    se.ID_SEDE,
    (
      SELECT LISTAGG(pe.TITULO, ', ' ON OVERFLOW TRUNCATE '...') WITHIN GROUP (ORDER BY pe.TITULO)
      FROM DESCUENTOS_PELICULA dp
      JOIN PELICULAS pe ON pe.ID_PELICULA = dp.ID_PELICULA
      WHERE dp.ID_DESCUENTO = d.ID_DESCUENTO
    ) AS PELICULAS
  FROM DESCUENTOS d
  JOIN SEDES se ON se.ID_SEDE = d.ID_SEDE
  WHERE (:estado IS NULL OR d.ESTADO_DESCUENTO = :estado)
    AND (:idSede IS NULL OR se.ID_SEDE = :idSede)
    AND (:idPelicula IS NULL OR EXISTS (
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
  busqueda = null,
  idSede = null,
  idPelicula = null,
  fechaInicio = null,
  fechaFin = null,
  estado = null,
} = {}) {
  const resultado = await ejecutar(sqlListarDescuentos, { busqueda, idSede, idPelicula, fechaInicio, fechaFin, estado });
  return resultado.rows;
}
import { ejecutar } from '../configuracion/baseDatos.js';

// llega como texto en hora de Costa Rica ('AAAA-MM-DD HH24:MI:SS')
const FORMATO_AHORA = 'YYYY-MM-DD HH24:MI:SS';

const sqlSedesActivas = `
  SELECT ID_SEDE, NOMBRE_SEDE
  FROM SEDES
  WHERE ESTADO_SEDE = 1
  ORDER BY NOMBRE_SEDE
`;

const sqlExisteSedeActiva = `SELECT 1 FROM SEDES WHERE ID_SEDE = :idSede AND ESTADO_SEDE = 1`;

const sqlCartelera = `
  SELECT pe.ID_PELICULA, pe.TITULO, pe.DURACION, pe.CLASIFICACION, pe.CLAVE_POSTER, pe.CLAVE_BANNER
  FROM PELICULAS pe
  WHERE pe.ESTADO_PELICULA = 1
    AND EXISTS (
      SELECT 1
      FROM PROYECCIONES p
      JOIN SALAS s ON s.ID_SALA = p.ID_SALA
      WHERE p.ID_PELICULA = pe.ID_PELICULA
        AND s.ID_SEDE = :idSede
        AND s.ESTADO_SALA = 1
        AND p.ESTADO_PROYECCION = 1
        AND p.FECHA > TO_DATE(:ahora, '${FORMATO_AHORA}')
    )
  ORDER BY pe.TITULO
`;

export async function listarSedesActivas() {
  const resultado = await ejecutar(sqlSedesActivas);
  return resultado.rows;
}

export async function existeSedeActiva(idSede) {
  const resultado = await ejecutar(sqlExisteSedeActiva, { idSede });
  return resultado.rows.length > 0;
}

export async function listarCartelera(idSede, ahora) {
  const resultado = await ejecutar(sqlCartelera, { idSede, ahora });
  return resultado.rows;
}

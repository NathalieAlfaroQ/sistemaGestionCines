import { ejecutar } from '../configuracion/baseDatos.js';

// Las fechas se manejan como texto en hora de Costa Rica ('AAAA-MM-DD HH24:MI:SS').
// La columna DATE no guarda zona horaria y la BD corre en UTC, así que no se usa SYSDATE.
const FORMATO_AHORA = 'YYYY-MM-DD HH24:MI:SS';

// Una proyección está vigente si ella, su película, su sala y su sede están activas
// y todavía no ha empezado.
const desdeProyeccion = `
  FROM PROYECCIONES p
  JOIN PELICULAS pe ON pe.ID_PELICULA = p.ID_PELICULA
  JOIN SALAS s      ON s.ID_SALA = p.ID_SALA
  JOIN SEDES se     ON se.ID_SEDE = s.ID_SEDE
  JOIN FORMATOS f   ON f.ID_FORMATO = s.ID_FORMATO
`;

const condicionesVigente = `
  p.ESTADO_PROYECCION = 1
  AND pe.ESTADO_PELICULA = 1
  AND s.ESTADO_SALA = 1
  AND se.ESTADO_SEDE = 1
  AND p.FECHA > TO_DATE(:ahora, '${FORMATO_AHORA}')
`;

// Convierte [5, 8] en ':asiento0, :asiento1' y { asiento0: 5, asiento1: 8 }.
// Oracle no acepta un arreglo en un solo bind de IN, así que se arma un bind por id.
export function armarBindsLista(ids, prefijo = 'asiento') {
  const valores = {};
  const marcadores = ids.map((id, indice) => {
    valores[`${prefijo}${indice}`] = id;
    return `:${prefijo}${indice}`;
  });
  return { marcadores: marcadores.join(', '), valores };
}

// Información general de la película

const sqlPelicula = `
  SELECT ID_PELICULA, TITULO, DURACION, CLASIFICACION, SINOPSIS, CLAVE_POSTER, CLAVE_BANNER
  FROM PELICULAS
  WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

const sqlGeneros = `
  SELECT g.NOMBRE_GENERO
  FROM GENEROS_PELICULA gp
  JOIN GENEROS g ON g.ID_GENERO = gp.ID_GENERO
  WHERE gp.ID_PELICULA = :idPelicula
  ORDER BY g.NOMBRE_GENERO
`;

const sqlIdiomas = `
  SELECT i.NOMBRE_IDIOMA
  FROM IDIOMAS_PELICULA ip
  JOIN IDIOMAS i ON i.ID_IDIOMA = ip.ID_IDIOMA
  WHERE ip.ID_PELICULA = :idPelicula
  ORDER BY i.NOMBRE_IDIOMA
`;

// Formatos en los que la película tiene funciones próximas (2D, 3D...)
const sqlFormatos = `
  SELECT DISTINCT f.NOMBRE_FORMATO
  ${desdeProyeccion}
  WHERE p.ID_PELICULA = :idPelicula AND ${condicionesVigente}
  ORDER BY f.NOMBRE_FORMATO
`;

export async function obtenerPelicula(idPelicula, ahora) {
  const resultado = await ejecutar(sqlPelicula, { idPelicula });
  const fila = resultado.rows[0];
  if (!fila) return null;

  const [generos, idiomas, formatos] = await Promise.all([
    ejecutar(sqlGeneros, { idPelicula }),
    ejecutar(sqlIdiomas, { idPelicula }),
    ejecutar(sqlFormatos, { idPelicula, ahora }),
  ]);

  return {
    fila,
    generos: generos.rows.map(([nombre]) => nombre),
    idiomas: idiomas.rows.map(([nombre]) => nombre),
    formatos: formatos.rows.map(([nombre]) => nombre),
  };
}

// Horarios de un día

const sqlHorarios = `
  SELECT p.ID_PROYECCION, se.ID_SEDE, se.NOMBRE_SEDE, pr.NOMBRE_PROVINCIA,
    f.ID_FORMATO, f.NOMBRE_FORMATO, TO_CHAR(p.FECHA, 'HH24:MI') AS HORA
  ${desdeProyeccion}
  JOIN CANTONES c    ON c.ID_CANTON = se.ID_CANTON
  JOIN PROVINCIAS pr ON pr.ID_PROVINCIA = c.ID_PROVINCIA
  WHERE p.ID_PELICULA = :idPelicula
    AND p.FECHA >= TO_DATE(:fecha, 'YYYY-MM-DD')
    AND p.FECHA <  TO_DATE(:fecha, 'YYYY-MM-DD') + 1
    AND ${condicionesVigente}
  ORDER BY se.NOMBRE_SEDE, f.NOMBRE_FORMATO, p.FECHA
`;

export async function listarHorarios(idPelicula, fecha, ahora) {
  const resultado = await ejecutar(sqlHorarios, { idPelicula, fecha, ahora });
  return resultado.rows;
}

// Datos de la proyección, su sede, sala y formato

const sqlProyeccionVigente = `
  SELECT p.ID_PROYECCION, p.ID_PELICULA, TO_CHAR(p.FECHA, 'YYYY-MM-DD HH24:MI') AS FECHA,
    se.NOMBRE_SEDE, s.NOMBRE_SALA, f.NOMBRE_FORMATO
  ${desdeProyeccion}
  WHERE p.ID_PROYECCION = :idProyeccion AND ${condicionesVigente}
`;

export async function obtenerProyeccionVigente(idProyeccion, ahora) {
  const resultado = await ejecutar(sqlProyeccionVigente, { idProyeccion, ahora });
  return resultado.rows[0] ?? null;
}

// Mapa de asientos de la proyección, indicando cuáles están ocupados

const sqlAsientos = `
  SELECT a.ID_ASIENTO, a.FILA, a.NUMERO,
    CASE WHEN df.ID_ASIENTO IS NULL THEN 0 ELSE 1 END AS OCUPADO
  FROM PROYECCIONES p
  JOIN ASIENTOS a ON a.ID_SALA = p.ID_SALA
  LEFT JOIN DETALLES_FACTURA df
    ON df.ID_PROYECCION = p.ID_PROYECCION AND df.ID_ASIENTO = a.ID_ASIENTO
  WHERE p.ID_PROYECCION = :idProyeccion
  ORDER BY a.FILA, a.NUMERO
`;

export async function listarAsientos(idProyeccion) {
  const resultado = await ejecutar(sqlAsientos, { idProyeccion });
  return resultado.rows;
}

// Orden de columnas: 0: ID_TIPO_BOLETO, 1: NOMBRE_TIPO_BOLETO, 2: PRECIO
const sqlTiposBoleto = `
  SELECT ID_TIPO_BOLETO, NOMBRE_TIPO_BOLETO, PRECIO
  FROM TIPOS_BOLETO
  ORDER BY ID_TIPO_BOLETO
`;

export async function listarTiposBoleto() {
  const resultado = await ejecutar(sqlTiposBoleto);
  return resultado.rows;
}

// Cuántos de los asientos pedidos pertenecen a la sala de la proyección
export async function contarAsientosDeSala(idProyeccion, idsAsientos) {
  const { marcadores, valores } = armarBindsLista(idsAsientos);
  const sql = `
    SELECT COUNT(*)
    FROM ASIENTOS a
    JOIN PROYECCIONES p ON p.ID_SALA = a.ID_SALA
    WHERE p.ID_PROYECCION = :idProyeccion AND a.ID_ASIENTO IN (${marcadores})
  `;
  const resultado = await ejecutar(sql, { idProyeccion, ...valores });
  return resultado.rows[0][0];
}

// Cuáles de los asientos pedidos ya están vendidos para la proyección
export async function listarAsientosOcupados(idProyeccion, idsAsientos) {
  const { marcadores, valores } = armarBindsLista(idsAsientos);
  const sql = `
    SELECT ID_ASIENTO
    FROM DETALLES_FACTURA
    WHERE ID_PROYECCION = :idProyeccion AND ID_ASIENTO IN (${marcadores})
  `;
  const resultado = await ejecutar(sql, { idProyeccion, ...valores });
  return resultado.rows.map(([idAsiento]) => idAsiento);
}
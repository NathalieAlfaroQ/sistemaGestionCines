import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

const sqlCrearPelicula = `
  INSERT INTO PELICULAS (TITULO, CLASIFICACION, DURACION, SINOPSIS)
  VALUES (:titulo, :clasificacion, :duracion, :sinopsis)
  RETURNING ID_PELICULA INTO :idPelicula
`;

const sqlAsignarGenero = `
  INSERT INTO GENEROS_PELICULA (ID_PELICULA, ID_GENERO)
  VALUES (:idPelicula, :idGenero)
`;

const sqlAsignarIdioma = `
  INSERT INTO IDIOMAS_PELICULA (ID_PELICULA, ID_IDIOMA)
  VALUES (:idPelicula, :idIdioma)
`;

export async function crearPelicula({ titulo, clasificacion, duracion, sinopsis, generos, idiomas }) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlCrearPelicula, {
      titulo,
      clasificacion,
      duracion,
      sinopsis,
      idPelicula: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });

    const idPelicula = resultado.outBinds.idPelicula[0];

    if (generos.length > 0) {
      await conexion.executeMany(
        sqlAsignarGenero,
        generos.map((idGenero) => ({ idPelicula, idGenero }))
      );
    }

    if (idiomas.length > 0) {
      await conexion.executeMany(
        sqlAsignarIdioma,
        idiomas.map((idIdioma) => ({ idPelicula, idIdioma }))
      );
    }

    return idPelicula;
  });
}

// Orden de las columnas que recibe el frontend:
// 0: ID_PELICULA, 1: TITULO, 2: GENEROS, 3: DURACION, 4: CLASIFICACION
const sqlListarPeliculas = `
  SELECT p.ID_PELICULA,
    p.TITULO,
    LISTAGG(g.NOMBRE_GENERO, '; ') WITHIN GROUP (ORDER BY g.NOMBRE_GENERO) AS GENEROS,
    p.DURACION,
    p.CLASIFICACION
  FROM PELICULAS p
  LEFT JOIN GENEROS_PELICULA gp ON gp.ID_PELICULA = p.ID_PELICULA
  LEFT JOIN GENEROS g           ON g.ID_GENERO = gp.ID_GENERO
  WHERE :busqueda IS NULL
    OR UPPER(p.TITULO) LIKE '%' || UPPER(:busqueda) || '%'
  GROUP BY p.ID_PELICULA, p.TITULO, p.DURACION, p.CLASIFICACION
  ORDER BY p.TITULO
`;

export async function listarPeliculas(busqueda = null) {
  const resultado = await ejecutar(sqlListarPeliculas, { busqueda });
  return resultado.rows;
}
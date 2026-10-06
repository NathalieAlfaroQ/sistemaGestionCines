import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

const sqlCrearPelicula = `
  INSERT INTO PELICULAS (TITULO, CLASIFICACION, DURACION, SINOPSIS, ESTADO_PELICULA)
  VALUES (:titulo, :clasificacion, :duracion, :sinopsis, 1)
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
// Solo se listan las películas activas (ESTADO_PELICULA = 1)
const sqlListarPeliculas = `
  SELECT p.ID_PELICULA,
    p.TITULO,
    LISTAGG(g.NOMBRE_GENERO, '; ') WITHIN GROUP (ORDER BY g.NOMBRE_GENERO) AS GENEROS,
    p.DURACION,
    p.CLASIFICACION
  FROM PELICULAS p
  LEFT JOIN GENEROS_PELICULA gp ON gp.ID_PELICULA = p.ID_PELICULA
  LEFT JOIN GENEROS g           ON g.ID_GENERO = gp.ID_GENERO
  WHERE p.ESTADO_PELICULA = 1
    AND (:busqueda IS NULL OR UPPER(p.TITULO) LIKE '%' || UPPER(:busqueda) || '%')
  GROUP BY p.ID_PELICULA, p.TITULO, p.DURACION, p.CLASIFICACION
  ORDER BY p.TITULO
`;

export async function listarPeliculas(busqueda = null) {
  const resultado = await ejecutar(sqlListarPeliculas, { busqueda });
  return resultado.rows;
}

const sqlClavesImagenes = `
  SELECT CLAVE_POSTER, CLAVE_BANNER
  FROM PELICULAS
  WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

const sqlActualizarImagen = {
  poster: `UPDATE PELICULAS SET CLAVE_POSTER = :clave WHERE ID_PELICULA = :idPelicula`,
  banner: `UPDATE PELICULAS SET CLAVE_BANNER = :clave WHERE ID_PELICULA = :idPelicula`,
};

export async function obtenerClavesImagenes(idPelicula) {
  const resultado = await ejecutar(sqlClavesImagenes, { idPelicula });
  return resultado.rows[0] ?? null;
}

export async function actualizarClaveImagen(idPelicula, tipo, clave) {
  await ejecutarTransaccion(async (conexion) => {
    await conexion.execute(sqlActualizarImagen[tipo], { clave, idPelicula });
  });
}

const sqlDesactivarPelicula = `
  UPDATE PELICULAS
  SET ESTADO_PELICULA = 0
  WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

export async function desactivarPelicula(idPelicula) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlDesactivarPelicula, { idPelicula });
    return resultado.rowsAffected;
  });
}

const sqlDetallePelicula = `
  SELECT ID_PELICULA, TITULO, SINOPSIS, DURACION, CLASIFICACION, CLAVE_POSTER, CLAVE_BANNER
  FROM PELICULAS
  WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

const sqlGenerosDePelicula = `
  SELECT ID_GENERO FROM GENEROS_PELICULA WHERE ID_PELICULA = :idPelicula ORDER BY ID_GENERO
`;

const sqlIdiomasDePelicula = `
  SELECT ID_IDIOMA FROM IDIOMAS_PELICULA WHERE ID_PELICULA = :idPelicula ORDER BY ID_IDIOMA
`;

export async function obtenerDetallePelicula(idPelicula) {
  const resultado = await ejecutar(sqlDetallePelicula, { idPelicula });
  const fila = resultado.rows[0];
  if (!fila) return null;

  const [generos, idiomas] = await Promise.all([
    ejecutar(sqlGenerosDePelicula, { idPelicula }),
    ejecutar(sqlIdiomasDePelicula, { idPelicula }),
  ]);

  return {
    fila,
    generos: generos.rows.map(([idGenero]) => idGenero),
    idiomas: idiomas.rows.map(([idIdioma]) => idIdioma),
  };
}
const sqlActualizarPelicula = `
  UPDATE PELICULAS
  SET TITULO = :titulo, CLASIFICACION = :clasificacion, DURACION = :duracion, SINOPSIS = :sinopsis
  WHERE ID_PELICULA = :idPelicula AND ESTADO_PELICULA = 1
`;

const sqlGenerosActuales = `SELECT ID_GENERO FROM GENEROS_PELICULA WHERE ID_PELICULA = :idPelicula`;
const sqlIdiomasActuales = `SELECT ID_IDIOMA FROM IDIOMAS_PELICULA WHERE ID_PELICULA = :idPelicula`;

const sqlQuitarGenero = `DELETE FROM GENEROS_PELICULA WHERE ID_PELICULA = :idPelicula AND ID_GENERO = :idGenero`;
const sqlQuitarIdioma = `DELETE FROM IDIOMAS_PELICULA WHERE ID_PELICULA = :idPelicula AND ID_IDIOMA = :idIdioma`;

async function sincronizar(conexion, { sqlActuales, sqlQuitar, sqlAsignar, idPelicula, ids, campo }) {
  const resultado = await conexion.execute(sqlActuales, { idPelicula });
  const actuales = resultado.rows.map(([id]) => id);

  const sobran = actuales.filter((id) => !ids.includes(id));
  const faltan = ids.filter((id) => !actuales.includes(id));

  if (sobran.length > 0) {
    await conexion.executeMany(
      sqlQuitar,
      sobran.map((id) => ({ idPelicula, [campo]: id }))
    );
  }

  if (faltan.length > 0) {
    await conexion.executeMany(
      sqlAsignar,
      faltan.map((id) => ({ idPelicula, [campo]: id }))
    );
  }
}

export async function actualizarPelicula(
  idPelicula,
  { titulo, clasificacion, duracion, sinopsis, generos, idiomas }
) {
  return await ejecutarTransaccion(async (conexion) => {
    const resultado = await conexion.execute(sqlActualizarPelicula, {
      titulo,
      clasificacion,
      duracion,
      sinopsis,
      idPelicula,
    });
    if (resultado.rowsAffected === 0) return 0;

    await sincronizar(conexion, {
      sqlActuales: sqlGenerosActuales,
      sqlQuitar: sqlQuitarGenero,
      sqlAsignar: sqlAsignarGenero,
      idPelicula,
      ids: generos,
      campo: 'idGenero',
    });
    await sincronizar(conexion, {
      sqlActuales: sqlIdiomasActuales,
      sqlQuitar: sqlQuitarIdioma,
      sqlAsignar: sqlAsignarIdioma,
      idPelicula,
      ids: idiomas,
      campo: 'idIdioma',
    });

    return resultado.rowsAffected;
  });
}
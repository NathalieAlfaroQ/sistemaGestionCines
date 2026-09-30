import { ejecutar } from '../configuracion/baseDatos.js';

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
  GROUP BY p.ID_PELICULA, p.TITULO, p.DURACION, p.CLASIFICACION
  ORDER BY p.TITULO
`;

export async function listarPeliculas() {
  const resultado = await ejecutar(sqlListarPeliculas);
  return resultado.rows;
}
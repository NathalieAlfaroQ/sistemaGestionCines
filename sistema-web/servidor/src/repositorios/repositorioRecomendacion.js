import { ejecutar } from '../configuracion/baseDatos.js';

const TIPO_DETALLE_BOLETO = 'BOLETO';

// Puntaje de cada película para un cliente, según lo que ha comprado. Solo devuelve las que tienen puntaje.
//  1. compras: una por factura y película, sin importar cuántos boletos compró.
//  2. puntos_genero: cada compra reparte 1 punto en partes iguales entre los géneros de su película.
//  3. perfil: el peso de cada género es su parte del total (suman 1).
//  4. el puntaje de una película es la suma de los pesos de sus géneros.
// Todo se acumula: no importa cuándo se compró. Cada fila: [idPelicula, puntaje]
const sqlPuntajesDePeliculas = `
  WITH compras AS (
    SELECT DISTINCT f.ID_FACTURA, p.ID_PELICULA
    FROM FACTURAS_FINALES f
    JOIN DETALLES_FACTURA df ON df.ID_FACTURA = f.ID_FACTURA AND df.TIPO_FACTURA = '${TIPO_DETALLE_BOLETO}'
    JOIN PROYECCIONES p ON p.ID_PROYECCION = df.ID_PROYECCION
    WHERE f.ID_CLIENTE = :idCliente
  ),
  generos_por_pelicula AS (
    SELECT ID_PELICULA, COUNT(*) AS TOTAL_GENEROS
    FROM GENEROS_PELICULA
    GROUP BY ID_PELICULA
  ),
  puntos_genero AS (
    SELECT gp.ID_GENERO, SUM(1 / g.TOTAL_GENEROS) AS PUNTOS
    FROM compras c
    JOIN GENEROS_PELICULA gp ON gp.ID_PELICULA = c.ID_PELICULA
    JOIN generos_por_pelicula g ON g.ID_PELICULA = c.ID_PELICULA
    GROUP BY gp.ID_GENERO
  ),
  perfil AS (
    SELECT ID_GENERO, PUNTOS / SUM(PUNTOS) OVER () AS PESO
    FROM puntos_genero
  )
  SELECT gp.ID_PELICULA, SUM(pf.PESO) AS PUNTAJE
  FROM GENEROS_PELICULA gp
  JOIN perfil pf ON pf.ID_GENERO = gp.ID_GENERO
  GROUP BY gp.ID_PELICULA
`;

export async function puntajesDePeliculas(idCliente) {
  const resultado = await ejecutar(sqlPuntajesDePeliculas, { idCliente });
  return resultado.rows;
}
import { ejecutar } from '../configuracion/baseDatos.js';

const TIPO_DETALLE_BOLETO = 'BOLETO';

// Orden de columnas: 0: ID_FACTURA, 1: TITULO, 2: CLAVE_POSTER, 3: FECHA_FUNCION ('AAAA-MM-DD HH24:MI'),
// 4: FECHA_COMPRA ('AAAA-MM-DD HH24:MI'). Las más recientes primero.
const sqlHistorialCompras = `
  SELECT f.ID_FACTURA, pe.TITULO, pe.CLAVE_POSTER,
    TO_CHAR(p.FECHA, 'YYYY-MM-DD HH24:MI'), TO_CHAR(f.FECHA, 'YYYY-MM-DD HH24:MI')
  FROM FACTURAS_FINALES f
  JOIN DETALLES_FACTURA df ON df.ID_FACTURA = f.ID_FACTURA AND df.TIPO_FACTURA = '${TIPO_DETALLE_BOLETO}'
  JOIN PROYECCIONES p      ON p.ID_PROYECCION = df.ID_PROYECCION
  JOIN PELICULAS pe        ON pe.ID_PELICULA = p.ID_PELICULA
  WHERE f.ID_CLIENTE = :idCliente
  GROUP BY f.ID_FACTURA, pe.TITULO, pe.CLAVE_POSTER, p.FECHA, f.FECHA
  ORDER BY f.FECHA DESC, f.ID_FACTURA DESC
`;

export async function listarHistorialCompras(idCliente) {
  const resultado = await ejecutar(sqlHistorialCompras, { idCliente });
  return resultado.rows;
}
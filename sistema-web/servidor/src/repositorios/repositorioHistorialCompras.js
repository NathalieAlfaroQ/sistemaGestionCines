import { ejecutar } from '../configuracion/baseDatos.js';

const TIPO_DETALLE_BOLETO = 'BOLETO';

// Una compra se puede cancelar hasta 5 días antes de la función. La regla la hace cumplir
// PR_SOLICITAR_DEVOLUCION; aquí solo se calcula para mostrar u ocultar el botón.
export const DIAS_MINIMOS_DEVOLUCION = 5;

export const ESTADO_COMPRA_ACTIVA = 'ACTIVA';
export const ESTADO_COMPRA_CANCELADA = 'CANCELADA';

// Orden de columnas: 0: ID_FACTURA, 1: TITULO, 2: CLAVE_POSTER, 3: FECHA_FUNCION ('AAAA-MM-DD HH24:MI'),
// 4: FECHA_COMPRA ('AAAA-MM-DD HH24:MI'), 5: ESTADO ('ACTIVA' o 'CANCELADA'),
// 6: PUEDE_CANCELAR (1 o 0), 7: MONTO (lo que se pagó y se devolvería). Las más recientes primero.
// Se devuelve la compra completa, así que todos sus boletos tienen el mismo estado
// ('ACTIVO' < 'DEVUELTO': MIN es 'ACTIVO' si queda algún boleto activo).
// "Ahora" en hora de Costa Rica: la BD corre en UTC y PROYECCIONES.FECHA guarda la hora local del cine.
const sqlHistorialCompras = `
  SELECT f.ID_FACTURA, pe.TITULO, pe.CLAVE_POSTER,
    TO_CHAR(p.FECHA, 'YYYY-MM-DD HH24:MI'), TO_CHAR(f.FECHA, 'YYYY-MM-DD HH24:MI'),
    CASE WHEN MIN(df.ESTADO_DETALLE) = 'ACTIVO'
      THEN '${ESTADO_COMPRA_ACTIVA}' ELSE '${ESTADO_COMPRA_CANCELADA}' END AS ESTADO,
    CASE WHEN MIN(df.ESTADO_DETALLE) = 'ACTIVO'
      AND p.FECHA - CAST(SYSTIMESTAMP AT TIME ZONE 'America/Costa_Rica' AS DATE) >= ${DIAS_MINIMOS_DEVOLUCION}
      THEN 1 ELSE 0 END AS PUEDE_CANCELAR,
    f.MONTO
  FROM FACTURAS_FINALES f
  JOIN DETALLES_FACTURA df ON df.ID_FACTURA = f.ID_FACTURA AND df.TIPO_FACTURA = '${TIPO_DETALLE_BOLETO}'
  JOIN PROYECCIONES p      ON p.ID_PROYECCION = df.ID_PROYECCION
  JOIN PELICULAS pe        ON pe.ID_PELICULA = p.ID_PELICULA
  WHERE f.ID_CLIENTE = :idCliente
  GROUP BY f.ID_FACTURA, pe.TITULO, pe.CLAVE_POSTER, p.FECHA, f.FECHA, f.MONTO
  ORDER BY f.FECHA DESC, f.ID_FACTURA DESC
`;

export async function listarHistorialCompras(idCliente) {
  const resultado = await ejecutar(sqlHistorialCompras, { idCliente });
  return resultado.rows;
}
import oracledb from 'oracledb';
import { ejecutar } from '../configuracion/baseDatos.js';

// Las fechas llegan como texto en hora de Costa Rica ('AAAA-MM-DD HH24:MI:SS'), ver utilidades/fechas.js
const FORMATO_FECHA = 'YYYY-MM-DD HH24:MI:SS';

// Cada asiento vendido es una línea de DETALLES_FACTURA de tipo boleto con cantidad 1
const TIPO_DETALLE_BOLETO = 'BOLETO';

// Restricción que impide vender dos veces el mismo asiento de una función
export const RESTRICCION_ASIENTO_VENDIDO = 'UQ_DETALLES_FACTURA_PROYECCION_ASIENTO';

// Nombre, apellido y correo del cliente. El correo está en CREDENCIALES (cuenta con contraseña)
// o en CREDENCIALES_GOOGLE (cuenta de Google).
// Orden de columnas: 0: NOMBRE, 1: APELLIDO, 2: CORREO
const sqlDatosCliente = `
  SELECT c.NOMBRE, c.APELLIDO, COALESCE(cr.CORREO, cg.CORREO) AS CORREO
  FROM CLIENTES c
  LEFT JOIN CREDENCIALES cr        ON cr.ID_CLIENTE = c.ID_CLIENTE
  LEFT JOIN CREDENCIALES_GOOGLE cg ON cg.ID_CLIENTE = c.ID_CLIENTE
  WHERE c.ID_CLIENTE = :idCliente
`;

export async function obtenerDatosCliente(idCliente) {
  const resultado = await ejecutar(sqlDatosCliente, { idCliente });
  return resultado.rows[0] ?? null;
}

const sqlIdMetodoPago = `
  SELECT ID_METODO
  FROM METODOS_PAGO
  WHERE NOMBRE_METODO = :nombre
`;

export async function obtenerIdMetodoPago(nombre) {
  const resultado = await ejecutar(sqlIdMetodoPago, { nombre });
  return resultado.rows[0]?.[0] ?? null;
}

// Las siguientes funciones reciben la conexión de ejecutarTransaccion: no hacen commit,
// todo se confirma o se deshace junto.

const sqlInsertarFactura = `
  INSERT INTO FACTURAS_FINALES (ID_CLIENTE, ID_METODO, MONTO, FECHA)
  VALUES (:idCliente, :idMetodo, :monto, TO_DATE(:fecha, '${FORMATO_FECHA}'))
  RETURNING ID_FACTURA INTO :idFactura
`;

export async function insertarFactura(conexion, { idCliente, idMetodo, monto, fecha }) {
  const resultado = await conexion.execute(sqlInsertarFactura, {
    idCliente,
    idMetodo,
    monto,
    fecha,
    idFactura: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
  });
  return resultado.outBinds.idFactura[0];
}

const sqlInsertarDetalleBoleto = `
  INSERT INTO DETALLES_FACTURA
    (ID_FACTURA, ID_ASIENTO, ID_PROYECCION, TIPO_FACTURA, CANTIDAD, MONTO, DESCUENTO, ID_TIPO_BOLETO)
  VALUES
    (:idFactura, :idAsiento, :idProyeccion, '${TIPO_DETALLE_BOLETO}', 1, :monto, :descuento, :idTipoBoleto)
`;

// detalles: [{ idAsiento, idTipoBoleto, monto, descuento }]
// Mientras la transacción no termine, estas filas sin confirmar bloquean los asientos:
// otra compra de los mismos asientos espera en el UNIQUE y, si esta se confirma, recibe ORA-00001.
export async function insertarDetallesBoletos(conexion, idFactura, idProyeccion, detalles) {
  const filas = detalles.map(({ idAsiento, idTipoBoleto, monto, descuento }) => ({
    idFactura,
    idAsiento,
    idProyeccion,
    monto,
    descuento,
    idTipoBoleto,
  }));
  await conexion.executeMany(sqlInsertarDetalleBoleto, filas);
}

// Datos del comprobante: una fila por boleto. Los datos de la factura y la función se repiten
// en cada fila (todos los boletos de una compra son de la misma función).
// Filtra también por cliente: nadie puede ver los boletos de otro cambiando el id en la URL.
// Orden de columnas:
//  0: ID_FACTURA  1: MONTO_TOTAL  2: FECHA_COMPRA  3: ID_INTENCION_PAGO  4: TITULO  5: CLASIFICACION
//  6: FECHA_FUNCION  7: NOMBRE_SEDE  8: NOMBRE_SALA  9: NOMBRE_FORMATO  10: ID_PROYECCION
//  11: ID_ASIENTO  12: FILA  13: NUMERO  14: NOMBRE_TIPO_BOLETO  15: MONTO_BOLETO
const sqlComprobante = `
  SELECT f.ID_FACTURA, f.MONTO, TO_CHAR(f.FECHA, 'YYYY-MM-DD HH24:MI'), f.ID_INTENCION_PAGO,
    pe.TITULO, pe.CLASIFICACION, TO_CHAR(p.FECHA, 'YYYY-MM-DD HH24:MI'),
    se.NOMBRE_SEDE, s.NOMBRE_SALA, fo.NOMBRE_FORMATO,
    df.ID_PROYECCION, df.ID_ASIENTO, a.FILA, a.NUMERO, tb.NOMBRE_TIPO_BOLETO, df.MONTO
  FROM FACTURAS_FINALES f
  JOIN DETALLES_FACTURA df ON df.ID_FACTURA = f.ID_FACTURA AND df.TIPO_FACTURA = '${TIPO_DETALLE_BOLETO}'
  JOIN ASIENTOS a          ON a.ID_ASIENTO = df.ID_ASIENTO
  JOIN TIPOS_BOLETO tb     ON tb.ID_TIPO_BOLETO = df.ID_TIPO_BOLETO
  JOIN PROYECCIONES p      ON p.ID_PROYECCION = df.ID_PROYECCION
  JOIN PELICULAS pe        ON pe.ID_PELICULA = p.ID_PELICULA
  JOIN SALAS s             ON s.ID_SALA = p.ID_SALA
  JOIN SEDES se            ON se.ID_SEDE = s.ID_SEDE
  JOIN FORMATOS fo         ON fo.ID_FORMATO = s.ID_FORMATO
  WHERE f.ID_FACTURA = :idFactura AND f.ID_CLIENTE = :idCliente
  ORDER BY a.FILA, a.NUMERO
`;

export async function listarBoletosDeFactura(idFactura, idCliente) {
  const resultado = await ejecutar(sqlComprobante, { idFactura, idCliente });
  return resultado.rows;
}

const sqlRegistrarIntencionPago = `
  UPDATE FACTURAS_FINALES
  SET ID_INTENCION_PAGO = :idIntencion
  WHERE ID_FACTURA = :idFactura
`;

export async function registrarIntencionPago(conexion, idFactura, idIntencion) {
  await conexion.execute(sqlRegistrarIntencionPago, { idFactura, idIntencion });
}

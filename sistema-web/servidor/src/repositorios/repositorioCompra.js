import oracledb from 'oracledb';
import { ejecutar } from '../configuracion/baseDatos.js';

// Las fechas llegan como texto en hora de Costa Rica ('AAAA-MM-DD HH24:MI:SS')
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
// se confirma o se deshace junto.

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

// Tarjeta guardada del cliente (una por cliente, por el UNIQUE de ID_CLIENTE).
// TOKEN es el id del método de pago en ONVO, nunca el número de la tarjeta.
export const ESTADO_METODO_ACTIVO = 'ACTIVO';

// Orden de columnas: 0: TOKEN, 1: MARCA, 2: ULTIMOS_DIGITOS, 3: VENCIMIENTO ('AAAA-MM'), 4: TITULAR
const sqlMetodoPagoCliente = `
  SELECT TOKEN, MARCA, ULTIMOS_DIGITOS, TO_CHAR(FECHA_VENCIMIENTO, 'YYYY-MM'), TITULAR
  FROM METODOS_PAGO_CLIENTE
  WHERE ID_CLIENTE = :idCliente AND ESTADO = '${ESTADO_METODO_ACTIVO}'
`;

export async function obtenerMetodoPagoCliente(idCliente) {
  const resultado = await ejecutar(sqlMetodoPagoCliente, { idCliente });
  return resultado.rows[0] ?? null;
}

// Si el cliente ya tenía una tarjeta guardada, la nueva la reemplaza.
// La fecha de vencimiento se guarda como el último día del mes ('AAAA-MM' -> LAST_DAY).
const sqlGuardarMetodoPagoCliente = `
  MERGE INTO METODOS_PAGO_CLIENTE m
  USING (SELECT :idCliente AS ID_CLIENTE FROM DUAL) d
  ON (m.ID_CLIENTE = d.ID_CLIENTE)
  WHEN MATCHED THEN UPDATE SET
    m.ID_METODO = :idMetodo,
    m.TOKEN = :token,
    m.MARCA = :marca,
    m.ULTIMOS_DIGITOS = :ultimosDigitos,
    m.FECHA_VENCIMIENTO = LAST_DAY(TO_DATE(:vencimiento, 'YYYY-MM')),
    m.TITULAR = :titular,
    m.ESTADO = '${ESTADO_METODO_ACTIVO}'
  WHEN NOT MATCHED THEN INSERT
    (ID_CLIENTE, ID_METODO, TOKEN, MARCA, ULTIMOS_DIGITOS, FECHA_VENCIMIENTO, TITULAR, ESTADO)
  VALUES
    (d.ID_CLIENTE, :idMetodo, :token, :marca, :ultimosDigitos,
     LAST_DAY(TO_DATE(:vencimiento, 'YYYY-MM')), :titular, '${ESTADO_METODO_ACTIVO}')
`;

export async function guardarMetodoPagoCliente({ idCliente, idMetodo, token, marca, ultimosDigitos, vencimiento, titular }) {
  await ejecutar(sqlGuardarMetodoPagoCliente, {
    idCliente,
    idMetodo,
    token,
    marca,
    ultimosDigitos,
    vencimiento,
    titular,
  });
}

const sqlRegistrarIntencionPago = `
  UPDATE FACTURAS_FINALES
  SET ID_INTENCION_PAGO = :idIntencion
  WHERE ID_FACTURA = :idFactura
`;

export async function registrarIntencionPago(conexion, idFactura, idIntencion) {
  await conexion.execute(sqlRegistrarIntencionPago, { idFactura, idIntencion });
}
import { ejecutar } from '../configuracion/baseDatos.js';

// Reserva temporal de asientos: mientras el cliente paga, sus asientos quedan apartados
// en RESERVAS_ASIENTOS. Si paga, pasan a DETALLES_FACTURA; si no, la reserva vence sola.


export const MINUTOS_RESERVA = 5;

// PK (ID_PROYECCION, ID_ASIENTO): si otro cliente ya apartó el asiento, Oracle lanza ORA-00001 con este nombre
export const RESTRICCION_ASIENTO_RESERVADO = 'PK_RESERVAS_ASIENTOS';

// Las siguientes funciones reciben la conexión de ejecutarTransaccion: no hacen commit,
// se confirma o se deshace junto.

// Las filas vencidas siguen ocupando la PK: se borran antes de reservar para liberar esos asientos
const sqlBorrarVencidas = `
  DELETE FROM RESERVAS_ASIENTOS
  WHERE FECHA_EXPIRACION <= SYSDATE
`;

export async function borrarReservasVencidas(conexion) {
  await conexion.execute(sqlBorrarVencidas);
}

// Una sola reserva por cliente: se usa al reservar de nuevo, al cancelar y al terminar la compra
const sqlBorrarReservaCliente = `
  DELETE FROM RESERVAS_ASIENTOS
  WHERE ID_CLIENTE = :idCliente
`;

export async function borrarReservaCliente(conexion, idCliente) {
  await conexion.execute(sqlBorrarReservaCliente, { idCliente });
}

const sqlInsertarReserva = `
  INSERT INTO RESERVAS_ASIENTOS
    (ID_CLIENTE, ID_PROYECCION, ID_ASIENTO, ID_TIPO_BOLETO, FECHA_EXPIRACION)
  VALUES
    (:idCliente, :idProyeccion, :idAsiento, :idTipoBoleto, SYSDATE + :minutos / 1440)
`;

// detalles: [{ idAsiento, idTipoBoleto }]
export async function insertarReserva(conexion, idCliente, idProyeccion, detalles, minutos = MINUTOS_RESERVA) {
  const filas = detalles.map(({ idAsiento, idTipoBoleto }) => ({
    idCliente,
    idProyeccion,
    idAsiento,
    idTipoBoleto,
    minutos,
  }));
  await conexion.executeMany(sqlInsertarReserva, filas);
}

// Para la compra: bloquea las filas vigentes de la reserva hasta el commit o el rollback,
// así nadie puede borrarlas (ni tomar esos asientos) mientras se cobra.
// Orden de columnas: 0: ID_ASIENTO, 1: ID_TIPO_BOLETO
const sqlBloquearReservaCliente = `
  SELECT ID_ASIENTO, ID_TIPO_BOLETO
  FROM RESERVAS_ASIENTOS
  WHERE ID_CLIENTE = :idCliente
    AND ID_PROYECCION = :idProyeccion
    AND FECHA_EXPIRACION > SYSDATE
  ORDER BY ID_ASIENTO
  FOR UPDATE
`;

export async function bloquearReservaCliente(conexion, idCliente, idProyeccion) {
  const resultado = await conexion.execute(sqlBloquearReservaCliente, { idCliente, idProyeccion });
  return resultado.rows;
}

// Consulta suelta (sin transacción): reserva vigente del cliente, para la pantalla de pago.
// Devuelve [] si no tiene o si ya venció.
// Orden de columnas: 0: ID_PROYECCION, 1: ID_ASIENTO, 2: ID_TIPO_BOLETO, 3: SEGUNDOS_RESTANTES
// Restar dos DATE da días: por 86400 quedan segundos.
const sqlReservaCliente = `
  SELECT ID_PROYECCION, ID_ASIENTO, ID_TIPO_BOLETO,
    ROUND((FECHA_EXPIRACION - SYSDATE) * 86400) AS SEGUNDOS_RESTANTES
  FROM RESERVAS_ASIENTOS
  WHERE ID_CLIENTE = :idCliente AND FECHA_EXPIRACION > SYSDATE
  ORDER BY ID_ASIENTO
`;

export async function obtenerReservaCliente(idCliente) {
  const resultado = await ejecutar(sqlReservaCliente, { idCliente });
  return resultado.rows;
}

import { ejecutar } from '../configuracion/baseDatos.js';
import { armarBindsLista } from './repositorioReserva.js';

// Reserva temporal de asientos: mientras el cliente paga, sus asientos quedan apartados
// en RESERVAS_ASIENTOS. Si paga, pasan a DETALLES_FACTURA; si no, la reserva vence sola.


export const MINUTOS_RESERVA = 5;

// PK (ID_PROYECCION, ID_ASIENTO): si otro cliente ya apartó el asiento, Oracle lanza ORA-00001 con este nombre
export const RESTRICCION_ASIENTO_RESERVADO = 'PK_RESERVAS_ASIENTOS';

// Las siguientes funciones reciben la conexión de ejecutarTransaccion: no hacen commit,
// se confirma o se deshace junto.

// Las filas vencidas siguen ocupando la PK: antes de reservar se borran las de esos asientos.
// Solo las de esos asientos, no las de todo el cine: si una fila vencida está bloqueada por un
// pago en curso, solo espera quien quiere ese mismo asiento, no todos los que reservan.
export async function borrarReservasVencidas(conexion, idProyeccion, idsAsientos) {
  const { marcadores, valores } = armarBindsLista(idsAsientos);
  const sql = `
    DELETE FROM RESERVAS_ASIENTOS
    WHERE ID_PROYECCION = :idProyeccion AND ID_ASIENTO IN (${marcadores})
      AND FECHA_EXPIRACION <= SYSDATE
  `;
  await conexion.execute(sql, { idProyeccion, ...valores });
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

// Para la compra: bloquea TODAS las filas de la reserva del cliente en esa función hasta el commit
// o el rollback, así nadie puede borrarlas (ni tomar esos asientos) mientras se cobra.
// No filtra por fecha: trae VIGENTE (1 o 0) para que el servicio trate la reserva como todo o nada.
// Si se filtrara, una reserva que vence justo en ese segundo podría venir incompleta y se cobraría solo una parte.
// Orden de columnas: 0: ID_ASIENTO, 1: ID_TIPO_BOLETO, 2: VIGENTE
const sqlBloquearReservaCliente = `
  SELECT ID_ASIENTO, ID_TIPO_BOLETO,
    CASE WHEN FECHA_EXPIRACION > SYSDATE THEN 1 ELSE 0 END AS VIGENTE
  FROM RESERVAS_ASIENTOS
  WHERE ID_CLIENTE = :idCliente
    AND ID_PROYECCION = :idProyeccion
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

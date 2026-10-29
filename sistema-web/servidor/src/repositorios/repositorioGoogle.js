import oracledb from 'oracledb';
import { ejecutar, ejecutarTransaccion } from '../configuracion/baseDatos.js';

// Orden de columnas: 0: ID_CLIENTE, 1: NOMBRE, 2: APELLIDO
const sqlBuscarPorIdGoogle = `
  SELECT C.ID_CLIENTE, C.NOMBRE, C.APELLIDO
  FROM CREDENCIALES_GOOGLE G
  JOIN CLIENTES C ON C.ID_CLIENTE = G.ID_CLIENTE
  WHERE G.ID_GOOGLE = :idGoogle`;

const sqlCrearCliente = `
  INSERT INTO CLIENTES (NOMBRE, APELLIDO)
  VALUES (:nombre, :apellido)
  RETURNING ID_CLIENTE INTO :idCliente`;

const sqlCrearCredencialGoogle = `
  INSERT INTO CREDENCIALES_GOOGLE (ID_CLIENTE, ID_GOOGLE, CORREO)
  VALUES (:idCliente, :idGoogle, :correo)`;

export async function buscarPorIdGoogle(idGoogle) {
  const resultado = await ejecutar(sqlBuscarPorIdGoogle, { idGoogle });
  return resultado.rows[0] ?? null;
}

export async function crearClienteConGoogle({ idGoogle, correo, nombre, apellido }) {
  return ejecutarTransaccion(async (conexion) => {
    const cliente = await conexion.execute(sqlCrearCliente, {
      nombre,
      apellido,
      idCliente: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });
    const idCliente = cliente.outBinds.idCliente[0];

    await conexion.execute(sqlCrearCredencialGoogle, { idCliente, idGoogle, correo });

    return idCliente;
  });
}
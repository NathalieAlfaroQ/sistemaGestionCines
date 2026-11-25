import { ejecutar } from '../configuracion/baseDatos.js';

// NVL deja intacta la columna cuando el valor llega null (campo que no se quiere cambiar)
const ACTUALIZACION_POR_TIPO = {
  CLIENTE: `UPDATE CLIENTES SET NOMBRE = NVL(:nombre, NOMBRE), APELLIDO = NVL(:apellido, APELLIDO)
            WHERE ID_CLIENTE = :id`,
  EMPLEADO: `UPDATE EMPLEADOS SET NOMBRE_EMPLEADO = NVL(:nombre, NOMBRE_EMPLEADO), APELLIDO_EMPLEADO = NVL(:apellido, APELLIDO_EMPLEADO)
             WHERE ID_EMPLEADO = :id`,
  ADMINISTRADOR: `UPDATE ADMINISTRADORES SET NOMBRE = NVL(:nombre, NOMBRE), APELLIDO = NVL(:apellido, APELLIDO)
                  WHERE ID_ADMINISTRADOR = :id`,
};

// [tipoUsuario, idCliente, idEmpleado, idAdministrador] de la credencial, o null si no existe
export async function buscarCredencial(idCredencial) {
  const resultado = await ejecutar(
    `SELECT TIPO_USUARIO, ID_CLIENTE, ID_EMPLEADO, ID_ADMINISTRADOR
     FROM CREDENCIALES
     WHERE ID_CREDENCIAL = :idCredencial`,
    { idCredencial }
  );
  return resultado.rows[0] ?? null;
}

// nombre y apellido en null no se modifican
export async function actualizarNombre(tipoUsuario, id, { nombre, apellido }) {
  await ejecutar(ACTUALIZACION_POR_TIPO[tipoUsuario], { nombre, apellido, id });
}
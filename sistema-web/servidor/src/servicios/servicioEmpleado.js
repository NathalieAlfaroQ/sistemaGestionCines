import oracledb from 'oracledb'
import bcrypt from 'bcrypt'
import { getConnection } from '../db.js'

const MINUTOS_VIGENCIA = 20

export async function verificarEsAdministrador(idCredencial) {
  let connection
  try {
    connection = await getConnection()
    const result = await connection.execute(
      `SELECT TIPO_USUARIO FROM CREDENCIALES WHERE ID_CREDENCIAL = :id`,
      { id: idCredencial }
    )
    return result.rows.length > 0 && result.rows[0][0] === 'ADMINISTRADOR'
  } finally {
    if (connection) await connection.close()
  }
}

export async function correoYaExiste(correo) {
  let connection
  try {
    connection = await getConnection()
    const r = await connection.execute(
      'SELECT 1 FROM CREDENCIALES WHERE CORREO = :correo',
      { correo }
    )
    return r.rows.length > 0
  } finally {
    if (connection) await connection.close()
  }
}

export async function registrarUsuarioInterno({ nombre, apellido, correo, tipoUsuario, idSede, contrasenaTemp }) {
  let connection
  try {
    connection = await getConnection()
    
    let idEmpleado = null
    let idAdministrador = null

    if (tipoUsuario === 'EMPLEADO') {
      const rEmp = await connection.execute(
        `INSERT INTO EMPLEADOS (NOMBRE_EMPLEADO, APELLIDO_EMPLEADO, ESTADO_EMPLEADO, ID_SEDE)
         VALUES (:nombre, :apellido, 1, :idSede)
         RETURNING ID_EMPLEADO INTO :idEmpleado`,
        {
          nombre, apellido, idSede: Number(idSede),
          idEmpleado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: false }
      )
      idEmpleado = rEmp.outBinds.idEmpleado[0]
    } else {
      const rAdm = await connection.execute(
        `INSERT INTO ADMINISTRADORES (NOMBRE, APELLIDO, ESTADO_ADMINISTRADOR)
         VALUES (:nombre, :apellido, 1)
         RETURNING ID_ADMINISTRADOR INTO :idAdministrador`,
        {
          nombre, apellido,
          idAdministrador: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: false }
      )
      idAdministrador = rAdm.outBinds.idAdministrador[0]
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(contrasenaTemp, salt)
    const fechaVencimiento = new Date(Date.now() + MINUTOS_VIGENCIA * 60 * 1000)

    await connection.execute(
      `INSERT INTO CREDENCIALES
         (CORREO, HASH, SALT, TIPO_USUARIO, FECHA_VENCIMIENTO,
          ID_ADMINISTRADOR, ID_EMPLEADO, ID_CLIENTE)
       VALUES
         (:correo, :hash, :salt, :tipoUsuario, :fechaVencimiento,
          :idAdministrador, :idEmpleado, NULL)`,
      {
        correo, hash, salt, tipoUsuario, fechaVencimiento,
        idAdministrador: idAdministrador || null,
        idEmpleado: idEmpleado || null
      },
      { autoCommit: true }
    )

    return true
  } catch (error) {
    if (connection) await connection.rollback()
    throw error
  } finally {
    if (connection) await connection.close()
  }
}
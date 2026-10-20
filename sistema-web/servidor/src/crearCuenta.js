import express from 'express'
import bcrypt from 'bcrypt'
import oracledb from 'oracledb'
import { generarContrasena } from './generarContrasena.js'
import { enviarCorreoContrasena } from './enviarCorreo.js'
import { getConnection } from './db.js'

const router = express.Router()
const MINUTOS_VIGENCIA = 20

async function insertarCredencial(connection, {
  correo, contrasena, tipoUsuario, idCliente, idEmpleado, idAdministrador
}) {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(contrasena, salt)
  const fechaVencimiento = new Date(Date.now() + MINUTOS_VIGENCIA * 60 * 1000)

  const result = await connection.execute(
    `INSERT INTO CREDENCIALES
       (CORREO, HASH, SALT, TIPO_USUARIO, FECHA_VENCIMIENTO,
        ID_ADMINISTRADOR, ID_EMPLEADO, ID_CLIENTE)
     VALUES
       (:correo, :hash, :salt, :tipoUsuario, :fechaVencimiento,
        :idAdministrador, :idEmpleado, :idCliente)
     RETURNING ID_CREDENCIAL INTO :idCredencial`,
    {
      correo,
      hash,
      salt,
      tipoUsuario,
      fechaVencimiento,
      idAdministrador: idAdministrador || null,
      idEmpleado: idEmpleado || null,
      idCliente: idCliente || null,
      idCredencial: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    },
    { autoCommit: false }
  )

  return result.outBinds.idCredencial[0]
}

async function correoExiste(connection, correo) {
  const r = await connection.execute(
    'SELECT 1 FROM CREDENCIALES WHERE CORREO = :correo',
    { correo }
  )
  return r.rows.length > 0
}

router.post('/cliente', async (req, res) => {
  const { nombre, apellido, correo } = req.body

  if (!nombre || !apellido || !correo) {
    return res.status(400).json({ error: 'Nombre, apellido y correo son obligatorios' })
  }

  let connection

  try {
    connection = await getConnection()

    if (await correoExiste(connection, correo)) {
      return res.status(409).json({ error: 'El correo ya está registrado' })
    }

    const rCliente = await connection.execute(
      `INSERT INTO CLIENTES (NOMBRE, APELLIDO)
       VALUES (:nombre, :apellido)
       RETURNING ID_CLIENTE INTO :idCliente`,
      {
        nombre,
        apellido,
        idCliente: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: false }
    )

    const idCliente = rCliente.outBinds.idCliente[0]
    const contrasenaTemp = generarContrasena()

    await insertarCredencial(connection, {
      correo,
      contrasena: contrasenaTemp,
      tipoUsuario: 'CLIENTE',
      idCliente
    })

    await connection.commit()
    await enviarCorreoContrasena(correo, nombre, contrasenaTemp, 'CLIENTE')
    return res.status(201).json({ mensaje: 'Cuenta creada. Revisa tu correo.' })
  } catch (error) {
    if (connection) {
      try { await connection.rollback() } catch (_) {}
    }

    console.error('Error en /crear-cuenta/cliente:', error)
    return res.status(500).json({ error: 'Error al crear la cuenta' })
  } finally {
    if (connection) await connection.close()
  }
})
export default router
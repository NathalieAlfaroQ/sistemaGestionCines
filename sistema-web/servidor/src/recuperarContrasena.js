import express from 'express'
import bcrypt from 'bcrypt'
import { generarContrasena } from './generarContrasena.js'
import { enviarCorreoContrasena } from './enviarCorreo.js'
import { getConnection } from './db.js'

const router = express.Router()
const MINUTOS_VIGENCIA = 20

router.post('/', async (req, res) => {
  const { correo } = req.body

  if (!correo) {
    return res.status(400).json({ error: 'El correo es obligatorio' })
  }

  let connection

  try {
    connection = await getConnection()

    const result = await connection.execute(
      `SELECT ID_CREDENCIAL, TIPO_USUARIO, ID_CLIENTE, ID_EMPLEADO, ID_ADMINISTRADOR
       FROM CREDENCIALES
       WHERE CORREO = :correo`,
      { correo }
    )

    if (result.rows.length === 0) {
      return res.json({ mensaje: 'Si el correo está registrado, recibirás una contraseña temporal.' })
    }

    const [idCredencial, tipoUsuario, idCliente, idEmpleado, idAdministrador] = result.rows[0]

    let nombre = ''

    if (tipoUsuario === 'CLIENTE' && idCliente) {
      const r = await connection.execute(
        'SELECT NOMBRE FROM CLIENTES WHERE ID_CLIENTE = :id',
        { id: idCliente }
      )

      if (r.rows.length > 0) nombre = r.rows[0][0]
    } else if (tipoUsuario === 'EMPLEADO' && idEmpleado) {
      const r = await connection.execute(
        'SELECT NOMBRE_EMPLEADO FROM EMPLEADOS WHERE ID_EMPLEADO = :id',
        { id: idEmpleado }
      )

      if (r.rows.length > 0) nombre = r.rows[0][0]
    } else if (tipoUsuario === 'ADMINISTRADOR' && idAdministrador) {
      const r = await connection.execute(
        'SELECT NOMBRE FROM ADMINISTRADORES WHERE ID_ADMINISTRADOR = :id',
        { id: idAdministrador }
      )

      if (r.rows.length > 0) nombre = r.rows[0][0]
    }

    // Cuando se hace la contrasena, se le hace el hash
    const contrasenaTemp = generarContrasena()
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(contrasenaTemp, salt)
    const fechaVencimiento = new Date(Date.now() + MINUTOS_VIGENCIA * 60 * 1000)

    await connection.execute(
      `UPDATE CREDENCIALES
       SET HASH = :hash,
           SALT = :salt,
           FECHA_VENCIMIENTO = :fechaVencimiento
       WHERE ID_CREDENCIAL = :idCredencial`,
      { hash, salt, fechaVencimiento, idCredencial },
      { autoCommit: true }
    )

    await enviarCorreoContrasena(correo, nombre || 'usuario', contrasenaTemp, tipoUsuario)

    return res.json({
      mensaje: 'Si el correo está registrado, recibirás una contraseña temporal.'
    })
  } catch (error) {
    console.error('Error en /recuperar-contrasena:', error)

    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    if (connection) await connection.close()
  }
})
export default router
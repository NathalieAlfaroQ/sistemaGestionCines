import express from 'express'
import bcrypt from 'bcrypt'
import { getConnection } from './db.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { correo, contrasena } = req.body

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' })
  }

  let connection

  try {
    connection = await getConnection()

    // Buscando el correo en Oracle
    const result = await connection.execute(
      `SELECT ID_CREDENCIAL, CORREO, HASH, SALT, TIPO_USUARIO,
              FECHA_VENCIMIENTO, ID_CLIENTE, ID_EMPLEADO, ID_ADMINISTRADOR
       FROM CREDENCIALES
       WHERE CORREO = :correo`,
      { correo }
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const row = result.rows[0]
    const [
      idCredencial,
      correoDB,
      hashDB,
      saltDB,
      tipoUsuario,
      fechaVencimiento,
      idCliente,
      idEmpleado,
      idAdministrador
    ] = row

    // Compara contraseña
    const coincide = await bcrypt.compare(contrasena, hashDB)

    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Fecha de vencimiento para la contraseña temporal
    const esTemporal = fechaVencimiento !== null && fechaVencimiento !== undefined

    if (esTemporal) {
      const ahora = new Date()
      const vence = new Date(fechaVencimiento)

      if (ahora > vence) {
        return res.status(403).json({
          error: 'La contraseña temporal ha expirado. Solicita una nueva.'
        })
      }
    }

    let nombre = ''
    let apellido = ''

    if (tipoUsuario === 'CLIENTE') {
      const r = await connection.execute(
        'SELECT NOMBRE, APELLIDO FROM CLIENTES WHERE ID_CLIENTE = :id',
        { id: idCliente }
      )

      if (r.rows.length > 0) [nombre, apellido] = r.rows[0]
    } else if (tipoUsuario === 'EMPLEADO') {
      const r = await connection.execute(
        'SELECT NOMBRE_EMPLEADO, APELLIDO_EMPLEADO FROM EMPLEADOS WHERE ID_EMPLEADO = :id',
        { id: idEmpleado }
      )

      if (r.rows.length > 0) [nombre, apellido] = r.rows[0]
    } else if (tipoUsuario === 'ADMINISTRADOR') {
      const r = await connection.execute(
        'SELECT NOMBRE, APELLIDO FROM ADMINISTRADORES WHERE ID_ADMINISTRADOR = :id',
        { id: idAdministrador }
      )

      if (r.rows.length > 0) [nombre, apellido] = r.rows[0]
    }

    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        idCredencial,
        correo: correoDB,
        tipoUsuario,
        nombre,
        apellido,
        contrasenaTemporal: esTemporal   
      }
    })
  } catch (error) {
    console.error('Error en /iniciar-sesion:', error)

    return res.status(500).json({ error: 'Error del servidor' })
  } finally {
    if (connection) await connection.close()
  }
})
export default router
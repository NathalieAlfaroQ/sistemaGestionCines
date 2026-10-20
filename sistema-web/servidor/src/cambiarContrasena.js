import express from 'express'
import bcrypt from 'bcrypt'
import { getConnection } from './db.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { correo, contrasenaTemporal, contrasenaNueva } = req.body

  if (!correo || !contrasenaTemporal || !contrasenaNueva) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  if (contrasenaNueva.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
  }

  let connection

  try {
    connection = await getConnection()

    const result = await connection.execute(
      `SELECT ID_CREDENCIAL, HASH
       FROM CREDENCIALES
       WHERE CORREO = :correo`,
      { correo }
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const [idCredencial, hashActual] = result.rows[0]
    const coincide = await bcrypt.compare(contrasenaTemporal, hashActual)

    if (!coincide) {
      return res.status(401).json({ error: 'La contraseña temporal es incorrecta' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashNuevo = await bcrypt.hash(contrasenaNueva, salt)

    await connection.execute(
      `UPDATE CREDENCIALES
       SET HASH = :hash,
           SALT = :salt,
           FECHA_VENCIMIENTO = NULL
       WHERE ID_CREDENCIAL = :idCredencial`,
      { hash: hashNuevo, salt, idCredencial },
      { autoCommit: true }
    )

    return res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error en /cambiar-contrasena:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    if (connection) await connection.close()
  }
})
export default router
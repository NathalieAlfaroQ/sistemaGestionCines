import express from 'express'
import bcrypt from 'bcrypt'
import { getConnection } from './db.js'
import { MENSAJES } from './constantes/constantes.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { correo, contrasenaNueva } = req.body

  if (!correo || !contrasenaNueva) {
    return res.status(400).json({ error: 'Espacios obligatorios' })
  }

  const regexFuerte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#*?\-$%_])[A-Za-z\d@#*?\-$%_]{12,}$/

  if (!regexFuerte.test(contrasenaNueva)) {
    return res.status(400).json({ error: 'X Contraseña no segura' })
  }

  let connection

  try {
    connection = await getConnection()

    const result = await connection.execute(
      `SELECT ID_CREDENCIAL
       FROM CREDENCIALES
       WHERE CORREO = :correo`,
      { correo }
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: MENSAJES.CREDENCIALES })
    }

    const [idCredencial] = result.rows[0]
    const salt = await bcrypt.genSalt(10)
    const hashNuevo = await bcrypt.hash(contrasenaNueva, salt)

    await connection.execute(
      `UPDATE CREDENCIALES
       SET HASH = :hash,
           SALT = :salt,
           FECHA_VENCIMIENTO = SYSDATE + 90
       WHERE ID_CREDENCIAL = :idCredencial`,
      { hash: hashNuevo, salt, idCredencial },
      { autoCommit: true }
    )

    return res.json({ mensaje: 'Contraseña actualizada' })

  } catch (error) {
    console.error('Error en /cambiar-contrasena:', error)
    return res.status(500).json({ error: MENSAJES.SERVIDOR })
    
  } finally {
    if (connection) await connection.close()
  }
})

export default router
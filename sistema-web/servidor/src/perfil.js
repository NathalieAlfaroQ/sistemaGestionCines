import express from 'express'
import { getConnection } from './db.js'

const router = express.Router()

router.put('/', async (req, res) => {
  const { idCredencial, nombre, apellido } = req.body

  if (!idCredencial || !nombre || !apellido) {
    return res.status(400).json({ error: 'Faltan datos' })
  }

  let connection

  try {
    connection = await getConnection()

    const result = await connection.execute(
      `SELECT TIPO_USUARIO, ID_CLIENTE, ID_EMPLEADO, ID_ADMINISTRADOR
       FROM CREDENCIALES
       WHERE ID_CREDENCIAL = :id`,
      { id: idCredencial }
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credencial no encontrada' })
    }

    const [tipoUsuario, idCliente, idEmpleado, idAdministrador] = result.rows[0]

    if (tipoUsuario === 'CLIENTE') {
      await connection.execute(
        `UPDATE CLIENTES SET NOMBRE = :nombre, APELLIDO = :apellido
         WHERE ID_CLIENTE = :id`,
        { nombre, apellido, id: idCliente },
        { autoCommit: true }
      )
    } else if (tipoUsuario === 'EMPLEADO') {
      await connection.execute(
        `UPDATE EMPLEADOS SET NOMBRE_EMPLEADO = :nombre, APELLIDO_EMPLEADO = :apellido
         WHERE ID_EMPLEADO = :id`,
        { nombre, apellido, id: idEmpleado },
        { autoCommit: true }
      )
    } else if (tipoUsuario === 'ADMINISTRADOR') {
      await connection.execute(
        `UPDATE ADMINISTRADORES SET NOMBRE = :nombre, APELLIDO = :apellido
         WHERE ID_ADMINISTRADOR = :id`,
        { nombre, apellido, id: idAdministrador },
        { autoCommit: true }
      )
    } else {
      return res.status(400).json({ error: 'Tipo de usuario desconocido' })
    }

    return res.json({ mensaje: 'Perfil actualizado' })
  } catch (error) {
    console.error('Error en /perfil:', error)

    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    if (connection) await connection.close()
  }
})
export default router
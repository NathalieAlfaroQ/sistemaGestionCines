import express from 'express'
import bcrypt from 'bcrypt'
import oracledb from 'oracledb'
import { generarContrasena } from './generarContrasena.js'
import { enviarCorreoContrasena } from './enviarCorreo.js'
import { getConnection } from './db.js'
import { MENSAJES } from './constantes/constantes.js'

const router = express.Router()
const MINUTOS_VIGENCIA = 20

router.post('/interno', async (req, res) => {
  const { nombre, apellido, correo, tipoUsuario, idSede, idCreador } = req.body

  if (!nombre || !apellido || !correo || !tipoUsuario || !idSede) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  let connection

  try {
    connection = await getConnection()

    const checkAdmin = await connection.execute(
      `SELECT TIPO_USUARIO FROM CREDENCIALES WHERE ID_CREDENCIAL = :id`,
      { id: idCreador }
    )

    if (checkAdmin.rows.length === 0 || checkAdmin.rows[0][0] !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' })
    }

    const checkCorreo = await connection.execute(
      'SELECT 1 FROM CREDENCIALES WHERE CORREO = :correo', { correo }
    )

    if (checkCorreo.rows.length > 0) return res.status(409).json({ error: 'Correo inválido' })

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

    const contrasenaTemp = generarContrasena()
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(contrasenaTemp, salt)
    const fechaVencimiento = new Date(Date.now() + MINUTOS_VIGENCIA * 60 * 1000)

    await connection.execute(
      `INSERT INTO CREDENCIALES
         (CORREO, HASH, SALT, TIPO_USUARIO, FECHA_VENCIMIENTO, ID_ADMINISTRADOR, ID_EMPLEADO)
       VALUES
         (:correo, :hash, :salt, :tipoUsuario, :fechaVencimiento, :idAdministrador, :idEmpleado)`,
      {
        correo, hash, salt, tipoUsuario, fechaVencimiento,
        idAdministrador: idAdministrador || null,
        idEmpleado: idEmpleado || null
      },
      { autoCommit: true }
    )

    await enviarCorreoContrasena(correo, nombre, contrasenaTemp, tipoUsuario)
    return res.status(201).json({ mensaje: 'Usuario creado. Revisa su correo.' })

  } catch (error) {
    console.error('Error en /crear-empleado:', error)
    return res.status(500).json({ error: MENSAJES.SERVIDOR })
  } finally {
    if (connection) await connection.close()
  }
})

router.get('/listar', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const empleadosRes = await connection.execute(`
      SELECT E.ID_EMPLEADO, E.NOMBRE_EMPLEADO, E.APELLIDO_EMPLEADO,
             C.CORREO, C.TIPO_USUARIO, S.NOMBRE_SEDE, E.ID_SEDE
      FROM EMPLEADOS E
      JOIN CREDENCIALES C ON C.ID_EMPLEADO = E.ID_EMPLEADO
      LEFT JOIN SEDES S ON S.ID_SEDE = E.ID_SEDE
      WHERE C.TIPO_USUARIO = 'EMPLEADO'
        AND E.ESTADO_EMPLEADO = 1
    `);

    const empleados = empleadosRes.rows.map(row => ({
      idEmpleado: row[0],
      nombre: row[1],
      apellido: row[2],
      nombreCompleto: `${row[1]} ${row[2]}`,
      correo: row[3],
      tipoUsuario: row[4],
      nombreSede: row[5] || 'Sin sede',
      idSede: row[6]
    }));

    return res.json(empleados);
  } catch (error) {
    console.error('Error al listar empleados:', error);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

router.put('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, idSede } = req.body;

  let connection;
  try {
    connection = await getConnection();

    const existeEmpleado = await connection.execute(
      `SELECT 1 FROM EMPLEADOS WHERE ID_EMPLEADO = :id`, { id }
    );
    if (existeEmpleado.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    await connection.execute(
      `UPDATE EMPLEADOS
       SET NOMBRE_EMPLEADO = :nombre, APELLIDO_EMPLEADO = :apellido, ID_SEDE = :idSede
       WHERE ID_EMPLEADO = :id`,
      { nombre, apellido, idSede: Number(idSede), id }
    );

    await connection.execute(
      `UPDATE CREDENCIALES SET CORREO = :correo WHERE ID_EMPLEADO = :id`,
      { correo, id }
    );

    await connection.commit();
    return res.json({ mensaje: 'Empleado actualizado' });
  } catch (error) {
    console.error('Error al editar empleado:', error);
    if (connection) await connection.rollback();
    return res.status(500).json({ error: 'Error al editar' });
  } finally {
    if (connection) await connection.close();
  }
});

router.delete('/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  const { idCreador } = req.body;

  let connection;
  try {
    connection = await getConnection();

    const adminRes = await connection.execute(
      `SELECT ID_ADMINISTRADOR FROM CREDENCIALES
       WHERE ID_CREDENCIAL = :idCreador AND TIPO_USUARIO = 'ADMINISTRADOR'`,
      { idCreador }
    );
    if (adminRes.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const idAdministrador = adminRes.rows[0][0];

    const empRes = await connection.execute(
      `SELECT ESTADO_EMPLEADO FROM EMPLEADOS WHERE ID_EMPLEADO = :id`,
      { id }
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    const estadoAnterior = empRes.rows[0][0];

    if (estadoAnterior === 0) {
      return res.status(409).json({ error: 'El empleado ya está desactivado' });
    }

    await connection.execute(
      `UPDATE EMPLEADOS SET ESTADO_EMPLEADO = 0 WHERE ID_EMPLEADO = :id`,
      { id }
    );

    await connection.execute(
      `INSERT INTO BITACORAS_EMPLEADOS
         (ID_EMPLEADO, ACCION, ESTADO_ANTERIOR, ESTADO_ACTUAL, FECHA, ID_ADMINISTRADOR)
       VALUES (:id, 'DESACTIVACION', :estadoAnterior, '0', SYSDATE, :idAdministrador)`,
      { id, estadoAnterior: String(estadoAnterior), idAdministrador }
    );

    await connection.commit();
    return res.json({ mensaje: 'Empleado desactivado' });
  } catch (error) {
    console.error('Error al desactivar empleado:', error);
    if (connection) await connection.rollback();
    return res.status(500).json({ error: 'Error al desactivar' });
  } finally {
    if (connection) await connection.close();
  }
});

export default router
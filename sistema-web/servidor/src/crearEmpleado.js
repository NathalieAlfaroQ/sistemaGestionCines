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
    `);

    const adminsRes = await connection.execute(`
      SELECT A.ID_ADMINISTRADOR, A.NOMBRE, A.APELLIDO, 
             C.CORREO, C.TIPO_USUARIO, 'N/A' AS NOMBRE_SEDE
      FROM ADMINISTRADORES A
      JOIN CREDENCIALES C ON C.ID_ADMINISTRADOR = A.ID_ADMINISTRADOR
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

    const admins = adminsRes.rows.map(row => ({
      idEmpleado: row[0], 
      nombre: row[1],
      apellido: row[2],
      nombreCompleto: `${row[1]} ${row[2]}`,
      correo: row[3],
      tipoUsuario: row[4],
      nombreSede: row[5],
      idSede: null
    }));

    return res.json([...empleados, ...admins]);
  } catch (error) {
    console.error('Error al listar empleados:', error);
    return res.status(500).json({ error: MENSAJES.SERVIDOR });
  } finally {
    if (connection) await connection.close();
  }
});

router.put('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, tipoUsuario, idSede, idCreador } = req.body;

  let connection;
  try {
    connection = await getConnection();

    const checkAdmin = await connection.execute(
      `SELECT TIPO_USUARIO FROM CREDENCIALES WHERE ID_CREDENCIAL = :idCreador`,
      { idCreador }
    );
    if (checkAdmin.rows.length === 0 || checkAdmin.rows[0][0] !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    if (tipoUsuario === 'EMPLEADO') {
      await connection.execute(
        `UPDATE EMPLEADOS 
         SET NOMBRE_EMPLEADO = :nombre, APELLIDO_EMPLEADO = :apellido, ID_SEDE = :idSede
         WHERE ID_EMPLEADO = :id`,
        { nombre, apellido, idSede: Number(idSede), id }
      );
    } else {
      await connection.execute(
        `UPDATE ADMINISTRADORES 
         SET NOMBRE = :nombre, APELLIDO = :apellido
         WHERE ID_ADMINISTRADOR = :id`,
        { nombre, apellido, id }
      );
    }

    await connection.execute(
      `UPDATE CREDENCIALES SET CORREO = :correo WHERE ID_EMPLEADO = :id OR ID_ADMINISTRADOR = :id`,
      { correo, id }
    );
    
    await connection.commit();
    return res.json({ mensaje: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al editar' });
  } finally {
    if (connection) await connection.close();
  }
});

export default router
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
        `INSERT INTO ADMINISTRADORES (NOMBRE, APELLIDO, ESTADO)
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
        AND E.ESTADO_EMPLEADO = '1'
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
    console.error('Error al listar empleados:', error); // <-- ESTO ES CLAVE
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
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

    // Verificar que el id es un empleado (no un admin) y traer su estado
    const empRes = await connection.execute(
      `SELECT ESTADO_EMPLEADO FROM EMPLEADOS WHERE ID_EMPLEADO = :id`,
      { id }
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    const estadoAnterior = empRes.rows[0][0];

    if (estadoAnterior === '0') {
      return res.status(409).json({ error: 'El empleado ya está desactivado' });
    }

    await connection.execute(
      `UPDATE EMPLEADOS SET ESTADO_EMPLEADO = '0' WHERE ID_EMPLEADO = :id`,
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

// RUTAS DE DULCERÍA

async function verificarPermisoDulceria(connection, idCredencial) {
  const result = await connection.execute(
    `SELECT C.TIPO_USUARIO, 
            NVL(E.ID_SEDE, 
                (SELECT MIN(ID_SEDE) FROM SEDES_ADMINISTRADORES 
                 WHERE ID_ADMINISTRADOR = C.ID_ADMINISTRADOR 
                   AND FECHA_DESPIDO IS NULL)) AS ID_SEDE
     FROM CREDENCIALES C
     LEFT JOIN EMPLEADOS E ON E.ID_EMPLEADO = C.ID_EMPLEADO
     WHERE C.ID_CREDENCIAL = :id`,
    { id: idCredencial }
  )
  if (result.rows.length === 0) return null
  const [tipoUsuario, idSede] = result.rows[0]
  if (tipoUsuario !== 'ADMINISTRADOR' && tipoUsuario !== 'EMPLEADO') return null
  if (!idSede) return null // admin sin sede asignada no puede gestionar dulcería
  return { tipoUsuario, idSede }
}

// GET /api/dulceria/listar?idCredencial=X
router.get('/listar', async (req, res) => {
  const { idCredencial } = req.query
  let connection
  try {
    connection = await getConnection()
    const permiso = await verificarPermisoDulceria(connection, idCredencial)
    if (!permiso) return res.status(403).json({ error: 'No tienes permisos' })

    const result = await connection.execute(
      `SELECT CP.ID_CANTIDAD_PRODUCTO, P.ID_PRODUCTO, P.NOMBRE_PRODUCTO,
              CP.CANTIDAD, CP.PRECIO
       FROM CANTIDADES_PRODUCTOS CP
       JOIN PRODUCTOS P ON P.ID_PRODUCTO = CP.ID_PRODUCTO
       WHERE CP.ID_SEDE = :idSede
       ORDER BY P.NOMBRE_PRODUCTO`,
      { idSede: permiso.idSede }
    )

    const productos = result.rows.map(row => ({
      idCantidadProducto: row[0],
      idProducto: row[1],
      nombre: row[2],
      cantidad: row[3],
      precio: row[4]
    }))
    return res.json(productos)
  } catch (error) {
    console.error('Error al listar dulcería:', error)
    return res.status(500).json({ error: MENSAJES.SERVIDOR })
  } finally {
    if (connection) await connection.close()
  }
})

// POST /api/dulceria/crear
router.post('/crear', async (req, res) => {
  const { idCredencial, nombre, precio, cantidad } = req.body
  let connection
  try {
    connection = await getConnection()
    const permiso = await verificarPermisoDulceria(connection, idCredencial)
    if (!permiso) return res.status(403).json({ error: 'No tienes permisos' })

    // Validaciones de servidor (defensa en profundidad)
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 20) {
      return res.status(400).json({ error: 'Nombre inválido' })
    }
    const precioNum = Number(precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: 'Precio inválido' })
    }
    const cantidadNum = Number(cantidad)
    if (!Number.isInteger(cantidadNum) || cantidadNum < 0) {
      return res.status(400).json({ error: 'Cantidad inválida' })
    }

    // ¿Existe ya un producto con ese nombre? (para no duplicar en PRODUCTOS)
    const existente = await connection.execute(
      `SELECT ID_PRODUCTO FROM PRODUCTOS WHERE UPPER(NOMBRE_PRODUCTO) = UPPER(:nombre)`,
      { nombre: nombre.trim() }
    )
    let idProducto
    if (existente.rows.length > 0) {
      idProducto = existente.rows[0][0]
      // ¿Ya está asociado a esta sede?
      const yaEnSede = await connection.execute(
        `SELECT 1 FROM CANTIDADES_PRODUCTOS WHERE ID_SEDE = :idSede AND ID_PRODUCTO = :idProducto`,
        { idSede: permiso.idSede, idProducto }
      )
      if (yaEnSede.rows.length > 0) {
        return res.status(409).json({ error: 'Este producto ya existe en tu sucursal' })
      }
    } else {
      const rProd = await connection.execute(
        `INSERT INTO PRODUCTOS (NOMBRE_PRODUCTO) VALUES (:nombre)
         RETURNING ID_PRODUCTO INTO :idProducto`,
        {
          nombre: nombre.trim(),
          idProducto: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: false }
      )
      idProducto = rProd.outBinds.idProducto[0]
    }

    await connection.execute(
      `INSERT INTO CANTIDADES_PRODUCTOS (ID_SEDE, ID_PRODUCTO, CANTIDAD, PRECIO)
       VALUES (:idSede, :idProducto, :cantidad, :precio)`,
      { idSede: permiso.idSede, idProducto, cantidad: cantidadNum, precio: precioNum },
      { autoCommit: true }
    )

    return res.status(201).json({ mensaje: 'Producto creado con éxito' })
  } catch (error) {
    console.error('Error al crear producto:', error)
    if (connection) await connection.rollback()
    return res.status(500).json({ error: MENSAJES.SERVIDOR })
  } finally {
    if (connection) await connection.close()
  }
})

// PUT /api/dulceria/editar/:idCantidadProducto
router.put('/editar/:idCantidadProducto', async (req, res) => {
  const { idCantidadProducto } = req.params
  const { idCredencial, nombre, precio, cantidad } = req.body
  let connection
  try {
    connection = await getConnection()
    const permiso = await verificarPermisoDulceria(connection, idCredencial)
    if (!permiso) return res.status(403).json({ error: 'No tienes permisos' })

    // Verificar que la fila pertenece a la sede del usuario
    const pertenece = await connection.execute(
      `SELECT ID_PRODUCTO, PRECIO FROM CANTIDADES_PRODUCTOS
       WHERE ID_CANTIDAD_PRODUCTO = :id AND ID_SEDE = :idSede`,
      { id: idCantidadProducto, idSede: permiso.idSede }
    )
    if (pertenece.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en tu sucursal' })
    }
    const { ID_PRODUCTO: idProducto, PRECIO: precioAnterior } = pertenece.rows[0]

    // Validaciones
    if (!nombre || nombre.length > 20) return res.status(400).json({ error: 'Nombre inválido' })
    const precioNum = Number(precio)
    if (isNaN(precioNum) || precioNum <= 0) return res.status(400).json({ error: 'Precio inválido' })
    const cantidadNum = Number(cantidad)
    if (!Number.isInteger(cantidadNum) || cantidadNum < 0) return res.status(400).json({ error: 'Cantidad inválida' })

    // ¿Otro producto con el mismo nombre (para evitar duplicados)?
    const duplicado = await connection.execute(
      `SELECT 1 FROM PRODUCTOS WHERE UPPER(NOMBRE_PRODUCTO) = UPPER(:nombre) AND ID_PRODUCTO != :idProducto`,
      { nombre: nombre.trim(), idProducto }
    )
    if (duplicado.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe otro producto con ese nombre' })
    }

    await connection.execute(
      `UPDATE PRODUCTOS SET NOMBRE_PRODUCTO = :nombre WHERE ID_PRODUCTO = :idProducto`,
      { nombre: nombre.trim(), idProducto },
      { autoCommit: false }
    )
    await connection.execute(
      `UPDATE CANTIDADES_PRODUCTOS SET CANTIDAD = :cantidad, PRECIO = :precio
       WHERE ID_CANTIDAD_PRODUCTO = :id AND ID_SEDE = :idSede`,
      { cantidad: cantidadNum, precio: precioNum, id: idCantidadProducto, idSede: permiso.idSede },
      { autoCommit: false }
    )

    // Si cambió el precio, registrar en bitácora
    if (precioAnterior !== precioNum && permiso.tipoUsuario === 'ADMINISTRADOR') {
      await connection.execute(
        `INSERT INTO BITACORAS_PRECIO_DULCERIA
           (FECHA, PRECIO, ID_CANTIDAD_PRODUCTO, ID_ADMINISTRADOR)
         VALUES (SYSDATE, :precio, :idCantidadProducto, 
                 (SELECT ID_ADMINISTRADOR FROM CREDENCIALES WHERE ID_CREDENCIAL = :idCredencial))`,
        { precio: precioNum, idCantidadProducto, idCredencial },
        { autoCommit: false }
      )
    }

    await connection.commit()
    return res.json({ mensaje: 'Producto actualizado' })
  } catch (error) {
    console.error('Error al editar producto:', error)
    if (connection) await connection.rollback()
    return res.status(500).json({ error: MENSAJES.SERVIDOR })
  } finally {
    if (connection) await connection.close()
  }
})

// DELETE /api/dulceria/eliminar/:idCantidadProducto
router.delete('/eliminar/:idCantidadProducto', async (req, res) => {
  const { idCantidadProducto } = req.params
  const { idCredencial } = req.body
  let connection
  try {
    connection = await getConnection()
    const permiso = await verificarPermisoDulceria(connection, idCredencial)
    if (!permiso) return res.status(403).json({ error: 'No tienes permisos' })

    const result = await connection.execute(
      `DELETE FROM CANTIDADES_PRODUCTOS
       WHERE ID_CANTIDAD_PRODUCTO = :id AND ID_SEDE = :idSede`,
      { id: idCantidadProducto, idSede: permiso.idSede },
      { autoCommit: true }
    )
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en tu sucursal' })
    }
    return res.json({ mensaje: 'Producto eliminado de la sucursal' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    if (connection) await connection.rollback()
    return res.status(500).json({ error: MENSAJES.SERVIDOR })
  } finally {
    if (connection) await connection.close()
  }
})

export default router
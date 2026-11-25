import express from 'express'
import oracledb from 'oracledb'
import { getConnection } from '../db.js'
import { MENSAJES } from '../constantes/constantes.js'

const router = express.Router()

async function verificarPermisoDulceria(connection, idCredencial) {
  const result = await connection.execute(
    `SELECT C.TIPO_USUARIO, C.ID_ADMINISTRADOR,
            E.ID_SEDE AS SEDE_EMPLEADO,
            (SELECT MIN(ID_SEDE) FROM SEDES_ADMINISTRADORES 
             WHERE ID_ADMINISTRADOR = C.ID_ADMINISTRADOR 
               AND FECHA_DESPIDO IS NULL) AS SEDE_ADMIN
     FROM CREDENCIALES C
     LEFT JOIN EMPLEADOS E ON E.ID_EMPLEADO = C.ID_EMPLEADO
     WHERE C.ID_CREDENCIAL = :id`,
    { id: idCredencial }
  )
  
  if (result.rows.length === 0) return null
  
  const [tipoUsuario, , sedeEmpleado, sedeAdmin] = result.rows[0]
  
  if (tipoUsuario !== 'ADMINISTRADOR' && tipoUsuario !== 'EMPLEADO') return null
  
  let idSede = tipoUsuario === 'EMPLEADO' ? sedeEmpleado : sedeAdmin

  if (!idSede && tipoUsuario === 'ADMINISTRADOR') {
    const fallback = await connection.execute(`SELECT MIN(ID_SEDE) FROM SEDES`)
    idSede = fallback.rows[0][0]
    console.log("⚠️ Admin sin sede asignada. Usando fallback:", idSede)
  }

  if (!idSede) return null 
  
  return { tipoUsuario, idSede }
}

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

router.post('/crear', async (req, res) => {
  const { idCredencial, nombre, precio, cantidad } = req.body
  let connection
  try {
    connection = await getConnection()
    const permiso = await verificarPermisoDulceria(connection, idCredencial)
    if (!permiso) return res.status(403).json({ error: 'No tienes permisos' })

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 20) {
      return res.status(400).json({ error: 'Nombre inválido (máx 20 caracteres)' })
    }
    const precioNum = Number(precio)
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: 'Precio inválido' })
    }
    const cantidadNum = Number(cantidad)
    if (!Number.isInteger(cantidadNum) || cantidadNum < 0) {
      return res.status(400).json({ error: 'Cantidad inválida' })
    }

    const existente = await connection.execute(
      `SELECT ID_PRODUCTO FROM PRODUCTOS WHERE UPPER(NOMBRE_PRODUCTO) = UPPER(:nombre)`,
      { nombre: nombre.trim() }
    )
    let idProducto
    if (existente.rows.length > 0) {
      idProducto = existente.rows[0][0]
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

router.put('/editar/:idCantidadProducto', async (req, res) => {
  const { idCantidadProducto } = req.params
  const { idCredencial, nombre, precio, cantidad } = req.body
  let connection
  try {
    connection = await getConnection()
    const permiso = await verificarPermisoDulceria(connection, idCredencial)
    if (!permiso) return res.status(403).json({ error: 'No tienes permisos' })

    const pertenece = await connection.execute(
      `SELECT ID_PRODUCTO, PRECIO FROM CANTIDADES_PRODUCTOS
       WHERE ID_CANTIDAD_PRODUCTO = :id AND ID_SEDE = :idSede`,
      { id: idCantidadProducto, idSede: permiso.idSede }
    )
    if (pertenece.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en tu sucursal' })
    }
    const { ID_PRODUCTO: idProducto, PRECIO: precioAnterior } = pertenece.rows[0]

    if (!nombre || nombre.length > 20) return res.status(400).json({ error: 'Nombre inválido' })
    const precioNum = Number(precio)
    if (Number.isNaN(precioNum) || precioNum <= 0) return res.status(400).json({ error: 'Precio inválido' })
    const cantidadNum = Number(cantidad)
    if (!Number.isInteger(cantidadNum) || cantidadNum < 0) return res.status(400).json({ error: 'Cantidad inválida' })

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
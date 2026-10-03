import express from 'express'
import bcrypt from 'bcrypt'
import oracledb from 'oracledb'
import { getConnection } from './db.js'
import { generarContrasena } from './generarContrasena.js'
import { enviarCorreoContrasena } from './enviarCorreo.js'

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();

const { getConnection } = require('./db');
const { generarContrasena } = require('./generarContrasena');
const { enviarCorreoContrasena } = require('./enviarCorreo');

const MINUTOS_VIGENCIA = 20;

/**
 * Inserta un registro en CREDENCIALES con el hash, salt y fecha de vencimiento.
 * Devuelve el ID_CREDENCIAL generado.
 */
async function insertarCredencial(connection, {
  correo, contrasena, tipoUsuario, idCliente, idEmpleado, idAdmin
}) {
  // Generar salt y hashear la contraseña con bcrypt
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(contrasena, salt);

  // Fecha de vencimiento = ahora + 20 minutos
  const fechaVencimiento = new Date(Date.now() + MINUTOS_VIGENCIA * 60 * 1000);

  const result = await connection.execute(
    `INSERT INTO CREDENCIALES
       (CORREO, HASH, SALT, TIPO_USUARIO, FECHA_VENCIMIENTO,
        ID_ADMIN, ID_EMPLEADO, ID_CLIENTE)
     VALUES
       (:correo, :hash, :salt, :tipoUsuario, :fechaVencimiento,
        :idAdmin, :idEmpleado, :idCliente)
     RETURNING ID_CREDENCIAL INTO :idCredencial`,
    {
      correo,
      hash,
      salt,
      tipoUsuario,
      fechaVencimiento,
      idAdmin: idAdmin || null,
      idEmpleado: idEmpleado || null,
      idCliente: idCliente || null,
      idCredencial: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
    },
    { autoCommit: false }
  );

  return result.outBinds.idCredencial[0];
}

/**
 * Verifica si el correo ya existe en CREDENCIALES
 */
async function correoExiste(connection, correo) {
  const r = await connection.execute(
    'SELECT 1 FROM CREDENCIALES WHERE CORREO = :correo',
    { correo }
  );
  return r.rows.length > 0;
}

/* 
   RUTA 1: Registro de CLIENTE (pantalla pública)
   POST /api/crear-cuenta/cliente
   body: { nombre, apellido, correo }
    */
router.post('/cliente', async (req, res) => {
  const { nombre, apellido, correo } = req.body;

  if (!nombre || !apellido || !correo) {
    return res.status(400).json({ error: 'Nombre, apellido y correo son obligatorios' });
  }

  let connection;
  try {
    connection = await getConnection();

    if (await correoExiste(connection, correo)) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // 1) Insertar CLIENTE
    const rCliente = await connection.execute(
      `INSERT INTO CLIENTES (NOMBRE, APELLIDO)
       VALUES (:nombre, :apellido)
       RETURNING ID_CLIENTE INTO :idCliente`,
      {
        nombre,
        apellido,
        idCliente: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
      },
      { autoCommit: false }
    );
    const idCliente = rCliente.outBinds.idCliente[0];

    // 2) Generar contraseña temporal
    const contrasenaTemp = generarContrasena();

    // 3) Insertar en CREDENCIALES
    await insertarCredencial(connection, {
      correo,
      contrasena: contrasenaTemp,
      tipoUsuario: 'CLIENTE',
      idCliente
    });

    // 4) Commit
    await connection.commit();

    // 5) Enviar correo
    await enviarCorreoContrasena(correo, nombre, contrasenaTemp, 'CLIENTE');

    return res.status(201).json({ mensaje: 'Cuenta creada. Revisa tu correo.' });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error('Error en /crear-cuenta/cliente:', error);
    return res.status(500).json({ error: 'Error al crear la cuenta' });
  } finally {
    if (connection) await connection.close();
  }
});

/*
   RUTA 2: Registro de EMPLEADO o ADMINISTRADOR
   POST /api/crear-cuenta/interno
   body: { nombre, apellido, correo, tipoUsuario, idSede?, estado? }
   */
router.post('/interno', async (req, res) => {
  const { nombre, apellido, correo, tipoUsuario, idSede, estado } = req.body;

  if (!nombre || !apellido || !correo || !tipoUsuario) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  if (!['EMPLEADO', 'ADMINISTRADOR'].includes(tipoUsuario)) {
    return res.status(400).json({ error: 'tipoUsuario inválido' });
  }

  let connection;
  try {
    connection = await getConnection();

    if (await correoExiste(connection, correo)) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    let idEmpleado = null;
    let idAdmin = null;

    if (tipoUsuario === 'EMPLEADO') {
      const r = await connection.execute(
        `INSERT INTO EMPLEADOS (NOMBRE_EMPLEADO, APELLIDO_EMPLEADO, ESTADO_EMPLEADO, ID_SEDE)
         VALUES (:nombre, :apellido, :estado, :idSede)
         RETURNING ID_EMPLEADO INTO :idEmpleado`,
        {
          nombre,
          apellido,
          estado: estado || 'ACTIVO',
          idSede: idSede || null,
          idEmpleado: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
        },
        { autoCommit: false }
      );
      idEmpleado = r.outBinds.idEmpleado[0];
    } else {
      const r = await connection.execute(
        `INSERT INTO ADMINISTRADORES (NOMBRE, APELLIDO, ESTADO)
         VALUES (:nombre, :apellido, :estado)
         RETURNING ID_ADMINISTRADOR INTO :idAdmin`,
        {
          nombre,
          apellido,
          estado: estado || 'ACTIVO',
          idAdmin: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
        },
        { autoCommit: false }
      );
      idAdmin = r.outBinds.idAdmin[0];
    }

    const contrasenaTemp = generarContrasena();

    await insertarCredencial(connection, {
      correo,
      contrasena: contrasenaTemp,
      tipoUsuario,
      idEmpleado,
      idAdmin
    });

    await connection.commit();

    await enviarCorreoContrasena(correo, nombre, contrasenaTemp, tipoUsuario);

    return res.status(201).json({ mensaje: 'Usuario interno registrado. Correo enviado.' });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error('Error en /crear-cuenta/interno:', error);
    return res.status(500).json({ error: 'Error al registrar usuario interno' });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
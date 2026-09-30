import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(carpetaServidor, '.env') });

const carpetaWallet = path.resolve(carpetaServidor, process.env.DB_WALLET_RUTA ?? './wallet');

let pool;

export async function iniciarPool() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.DB_USUARIO,
    password: process.env.DB_CONTRASENA,
    connectString: process.env.DB_SERVICIO,
    configDir: carpetaWallet,
    walletLocation: carpetaWallet,
    walletPassword: process.env.DB_WALLET_CONTRASENA,
    poolMin: 1,
    poolMax: 5,
  });

  return pool;
}

export async function ejecutar(sql, parametros = {}, opciones = {}) {
  const conexion = await (await iniciarPool()).getConnection();
  try {
    return await conexion.execute(sql, parametros, { autoCommit: true, ...opciones });
  } finally {
    await conexion.close();
  }
}

export async function cerrarPool() {
  if (!pool) return;
  await pool.close(10);
  pool = undefined;
}
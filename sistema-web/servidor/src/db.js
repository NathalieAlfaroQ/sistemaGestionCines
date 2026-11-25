import 'dotenv/config'
import oracledb from 'oracledb'

const WALLET_DIR = process.env.DB_WALLET_RUTA

console.log(' WALLET DIR:', WALLET_DIR)

export async function getConnection() {
  return await oracledb.getConnection({
    user: process.env.DB_USUARIO,
    password: process.env.DB_CONTRASENA,
    connectString: process.env.DB_SERVICIO,
    configDir: WALLET_DIR,
    walletLocation: WALLET_DIR,
    walletPassword: process.env.DB_WALLET_CONTRASENA
  })
}
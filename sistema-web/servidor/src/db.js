import 'dotenv/config'
import oracledb from 'oracledb'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WALLET_DIR = path.resolve(__dirname, process.env.DB_WALLET_RUTA)

console.log('📁 WALLET_DIR:', WALLET_DIR)

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
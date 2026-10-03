import 'dotenv/config'
import { getConnection } from './db.js'

async function main() {
  let conn
  try {
    conn = await getConnection()
    console.log('✅ Conexión a Oracle exitosa')

    const r = await conn.execute(
      'SELECT USER AS USUARIO, SYSDATE AS FECHA FROM DUAL'
    )
    console.log('Usuario conectado:', r.rows[0][0])
    console.log('Fecha del servidor:', r.rows[0][1])
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    if (conn) await conn.close()
  }
}

main()
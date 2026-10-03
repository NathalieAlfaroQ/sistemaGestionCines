import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import crearCuenta from './src/crearCuenta.js'

const app = express()
app.disable('x-powered-by')

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor Express corriendo correctamente',
    timestamp: new Date().toLocaleTimeString()
  })
})

// Rutas de creación de cuenta
app.use('/api/crear-cuenta', crearCuenta)

app.listen(PORT, () => {
  console.log(`Servidor Express listo en http://localhost:${PORT}`)
})
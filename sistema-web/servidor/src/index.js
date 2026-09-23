import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.disable('x-powered-by')

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL

const corsOptions = {
  origin: CLIENT_URL,
}

// Middlewares
app.use(cors(corsOptions))
app.use(express.json())

// Ruta de prueba (Endpoint de salud de la API)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor Express corriendo correctamente',
    timestamp: new Date().toLocaleTimeString(),
  })
})

app.listen(PORT, () => {
  console.log(`Servidor Express listo en http://localhost:${PORT}`)
})
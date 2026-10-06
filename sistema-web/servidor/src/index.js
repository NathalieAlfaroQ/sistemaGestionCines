import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crearCuenta from './crearCuenta.js'
import iniciarSesion from './iniciarSesion.js'
import recuperarContrasena from './recuperarContrasena.js'
import cambiarContrasena from './cambiarContrasena.js'
import perfil from './perfil.js'

const app = express()

app.disable('x-powered-by')

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toLocaleTimeString() })
})

app.use('/api/crear-cuenta', crearCuenta)
app.use('/api/iniciar-sesion', iniciarSesion)
app.use('/api/recuperar-contrasena', recuperarContrasena)
app.use('/api/cambiar-contrasena', cambiarContrasena)
app.use('/api/perfil', perfil)

app.listen(PORT, () => {
  console.log(`Servidor Express listo en http://localhost:${PORT}`)
})
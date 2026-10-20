import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rutasSede from './rutas/rutasSede.js'
import rutasUbicacion from './rutas/rutasUbicacion.js'
import rutasPelicula from './rutas/rutasPelicula.js'
import rutasCatalogo from './rutas/rutasCatalogo.js'
import crearCuenta from './crearCuenta.js'
import iniciarSesion from './iniciarSesion.js'
import recuperarContrasena from './recuperarContrasena.js'
import cambiarContrasena from './cambiarContrasena.js'
import perfil from './perfil.js'
import { manejadorErrores } from './middlewares/manejadorErrores.js'
import { verificarAutenticacion } from './middlewares/autenticacion.js'
import { autorizarRoles } from './middlewares/autorizacion.js'

dotenv.config()
const app = express()
app.disable('x-powered-by')
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL
app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toLocaleTimeString() })
})

const soloPersonal = autorizarRoles('ADMINISTRADOR', 'EMPLEADO');

app.use('/api/sedes', verificarAutenticacion, autorizarRoles('ADMINISTRADOR'), rutasSede);
app.use('/api/ubicaciones', verificarAutenticacion, autorizarRoles('ADMINISTRADOR'), rutasUbicacion);
app.use('/api/catalogo', verificarAutenticacion, soloPersonal, rutasCatalogo);
app.use('/api/peliculas',verificarAutenticacion, soloPersonal ,rutasPelicula);
app.use('/api/crear-cuenta', crearCuenta)
app.use('/api/iniciar-sesion', iniciarSesion)
app.use('/api/recuperar-contrasena', recuperarContrasena)
app.use('/api/cambiar-contrasena', cambiarContrasena)
app.use('/api/perfil', perfil)

app.use(manejadorErrores)

app.listen(PORT, () => {
  console.log(`Servidor Express listo en http://localhost:${PORT}`)
})
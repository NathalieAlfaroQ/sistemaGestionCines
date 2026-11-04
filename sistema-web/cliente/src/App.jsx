import { Routes, Route, useLocation } from 'react-router-dom'

// Layout y páginas del compañero
import DisenoGestion from './common/DisenoGestion.jsx'
import Sedes from './paginas/Sedes.jsx'
import Salas from './paginas/Salas.jsx'
import CrearSala from './paginas/CrearSala.jsx'
import VerSala from './paginas/VerSala.jsx'
import Proyecciones from './paginas/Proyecciones.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import VerPelicula from './paginas/VerPelicula.jsx'
import EditarPelicula from './paginas/EditarPelicula.jsx'
import Empleados from './paginas/Empleados.jsx' 
import RutaProtegida from './rutas/RutaProtegida.jsx'
import TerminosCondiciones from './paginas/TerminosCondiciones.jsx'


// Componentes y pantallas tuyas
import CrearCuenta from './componentes/CrearCuenta'
import IniciarSesion from './componentes/IniciarSesion'
import RecuperarContrasena from './componentes/RecuperarContrasena'
import CambiarContrasena from './componentes/CambiarContrasena'
import Perfil from './componentes/Perfil'

// Compra de boletos (SCRUM-93)
import HorariosPelicula from './paginas/HorariosPelicula.jsx'
import SeleccionAsientos from './paginas/SeleccionAsientos.jsx'
import Pago from './paginas/Pago.jsx'
// Barra de navegación y pie de página comunes
import BarraCliente from './common/BarraCliente.jsx'
import PiePagina from './common/PiePagina.jsx'

// Pantallas de cliente
import Inicio from './paginas/Inicio.jsx'

// Rutas que NO llevan navbar ni footer (pantallas públicas de auth)
const rutasPublicas = [
  '/iniciar-sesion',
  '/crear-cuenta',
  '/recuperar-contrasena',
  '/cambiar-contrasena'
]

// Prefijos de rutas de trabajo (usan DisenoGestion, que ya incluye BarraEmpleado y PiePagina)
const prefijosTrabajo = ['/peliculas', '/sedes', '/salas', '/proyecciones', '/empleados']

function App() {
  const { pathname } = useLocation()

  const esPublica = rutasPublicas.includes(pathname)
  const esTrabajo = prefijosTrabajo.some((p) => pathname.startsWith(p))
  const mostrarNavbarYFooter = !esPublica && !esTrabajo

  return (
    <>
      {mostrarNavbarYFooter && <BarraCliente />}

      <Routes>
        {/* --- Pantallas públicas (auth) --- */}
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

        {/* Rutas que solo piden sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
        </Route>

        {/* Pago de boletos: solo clientes */}
        <Route element={<RutaProtegida rolesPermitidos={['CLIENTE']} />}>
          <Route path="/pago" element={<Pago />} />
        </Route>

        {/* Rutas de trabajo: solo personal */}
        <Route element={<RutaProtegida rolesPermitidos={['EMPLEADO', 'ADMINISTRADOR']} />}>
          <Route element={<DisenoGestion />}>
            <Route path="/peliculas" element={<Peliculas />} />
            <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
            <Route path="/peliculas/:id" element={<VerPelicula />} />
            <Route path="/peliculas/:id/editar" element={<EditarPelicula />} />
            <Route path="/sedes" element={<Sedes />} />
<<<<<<< HEAD
            <Route path="/sedes/nueva" element={<CrearSede />} />
            
            {/* RUTA DE EMPLEADOS */}
            <Route path="/empleados" element={<Empleados />} />
            
=======
            <Route path="/salas" element={<Salas />} />
            <Route path="/salas/nueva" element={<CrearSala />} />
            <Route path="/salas/:id" element={<VerSala />} />
            <Route path="/proyecciones" element={<Proyecciones />} />
>>>>>>> desarrollo
          </Route>
        </Route>

        {/* --- Rutas de cliente --- */}
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/cartelera" element={<div>Cartelera</div>} />
        <Route path="/cartelera/:idPelicula" element={<HorariosPelicula />} />
        <Route path="/funciones/:idProyeccion/asientos" element={<SeleccionAsientos />} />
        <Route path="/terminos" element={<TerminosCondiciones />} />

<<<<<<< HEAD
        {/* Rutas de trabajo que aún no tienen componente */}
        <Route path="/salas" element={<div>Salas</div>} />
        <Route path="/proyecciones" element={<div>Proyecciones</div>} />
=======
        {/* Rutas de trabajo que aún no tienen componente, quedan como placeholder */}
        <Route path="/empleados" element={<div>Empleados</div>} />
>>>>>>> desarrollo

        {/* --- Inicio y cartelera --- */}
        <Route path="/" element={<Inicio />} />
      </Routes>

      {mostrarNavbarYFooter && <PiePagina />}
    </>
  )
}

export default App
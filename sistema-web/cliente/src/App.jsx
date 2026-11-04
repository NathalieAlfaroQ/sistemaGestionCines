import { Routes, Route, useLocation } from 'react-router-dom'

// Layout y páginas del compañero
import DisenoGestion from './common/DisenoGestion.jsx'
import Sedes from './paginas/Sedes.jsx'
import CrearSede from './paginas/CrearSede.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import VerPelicula from './paginas/VerPelicula.jsx'
import EditarPelicula from './paginas/EditarPelicula.jsx'
import Empleados from './paginas/Empleados.jsx' 
import RutaProtegida from './rutas/RutaProtegida.jsx'

// Componentes y pantallas tuyas
import BarraNavegacion from './componentes/BarraNavegacion'
import Hero from './componentes/Hero'
import PiePagina from './componentes/PiePagina'
import CrearCuenta from './componentes/CrearCuenta'
import IniciarSesion from './componentes/IniciarSesion'
import RecuperarContrasena from './componentes/RecuperarContrasena'
import CambiarContrasena from './componentes/CambiarContrasena'
import Perfil from './componentes/Perfil'

// Rutas que NO llevan navbar ni footer (pantallas públicas de auth)
const rutasPublicas = [
  '/iniciar-sesion',
  '/crear-cuenta',
  '/recuperar-contrasena',
  '/cambiar-contrasena'
]

// Prefijos de rutas de trabajo (usan DisenoGestion y no llevan tu navbar/footer)
const prefijosTrabajo = ['/peliculas', '/sedes', '/salas', '/proyecciones', '/empleados']

function App() {
  const { pathname } = useLocation()

  const esPublica = rutasPublicas.includes(pathname)
  const esTrabajo = prefijosTrabajo.some((p) => pathname.startsWith(p))
  const mostrarNavbarYFooter = !esPublica && !esTrabajo

  return (
    <>
      {mostrarNavbarYFooter && <BarraNavegacion />}

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

        {/* Rutas de trabajo: solo personal (Empleados y Administradores) */}
        <Route element={<RutaProtegida rolesPermitidos={['EMPLEADO', 'ADMINISTRADOR']} />}>
          <Route element={<DisenoGestion />}>
            <Route path="/peliculas" element={<Peliculas />} />
            <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
            <Route path="/peliculas/:id" element={<VerPelicula />} />
            <Route path="/peliculas/:id/editar" element={<EditarPelicula />} />
            <Route path="/sedes" element={<Sedes />} />
            <Route path="/sedes/nueva" element={<CrearSede />} />
            
            {/* RUTA DE EMPLEADOS */}
            <Route path="/empleados" element={<Empleados />} />
            
          </Route>
        </Route>

        {/* --- Rutas de cliente --- */}
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/cartelera" element={<div>Cartelera</div>} />

        {/* Rutas de trabajo que aún no tienen componente */}
        <Route path="/salas" element={<div>Salas</div>} />
        <Route path="/proyecciones" element={<div>Proyecciones</div>} />

        {/* --- Home --- */}
        <Route path="/" element={<Hero />} />
      </Routes>

      {mostrarNavbarYFooter && <PiePagina />}
    </>
  )
}

export default App
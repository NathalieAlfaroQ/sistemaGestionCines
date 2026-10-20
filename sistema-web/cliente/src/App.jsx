import { Routes, Route, useLocation } from 'react-router-dom'

// Layout y páginas del compañero
import DisenoGestion from './common/DisenoGestion.jsx'
import Sedes from './paginas/Sedes.jsx'
import CrearSede from './paginas/CrearSede.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import VerPelicula from './paginas/VerPelicula.jsx'
import EditarPelicula from './paginas/EditarPelicula.jsx'

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
        <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />

        {/* --- Rutas de trabajo (con el layout del compañero) --- */}
        <Route element={<DisenoGestion />}>
          <Route path="/peliculas" element={<Peliculas />} />
          <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
          <Route path="/peliculas/:id" element={<VerPelicula />} />
          <Route path="/peliculas/:id/editar" element={<EditarPelicula />} />
          <Route path="/sedes" element={<Sedes />} />
          <Route path="/sedes/nueva" element={<CrearSede />} />
        </Route>

        {/* --- Rutas de cliente (con tu navbar y footer) --- */}
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/cartelera" element={<div>Cartelera</div>} />
        <Route path="/perfil" element={<Perfil />} />

        {/* Rutas de trabajo que aún no tienen componente, quedan como placeholder */}
        <Route path="/salas" element={<div>Salas</div>} />
        <Route path="/proyecciones" element={<div>Proyecciones</div>} />
        <Route path="/empleados" element={<div>Empleados</div>} />

        {/* --- Home --- */}
        <Route path="/" element={<Hero />} />
      </Routes>

      {mostrarNavbarYFooter && <PiePagina />}
    </>
  )
}

export default App
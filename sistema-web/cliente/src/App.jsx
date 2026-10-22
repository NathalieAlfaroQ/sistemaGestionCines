import { Routes, Route, useLocation } from 'react-router-dom'

// Layout y páginas del compañero
import DisenoGestion from './common/DisenoGestion.jsx'
import Sedes from './paginas/Sedes.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import VerPelicula from './paginas/VerPelicula.jsx'
import EditarPelicula from './paginas/EditarPelicula.jsx'
import TerminosCondiciones from './paginas/TerminosCondiciones.jsx'

// Barra de navegación y pie de página comunes
import BarraCliente from './common/BarraCliente.jsx'
import PiePagina from './common/PiePagina.jsx'

// Pantallas de cliente
import Hero from './componentes/Hero'

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
        {/* */}


        {/* --- Rutas de trabajo (con el layout del compañero) --- */}
        <Route element={<DisenoGestion />}>
          <Route path="/peliculas" element={<Peliculas />} />
          <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
          <Route path="/peliculas/:id" element={<VerPelicula />} />
          <Route path="/peliculas/:id/editar" element={<EditarPelicula />} />
          {/* Crear sede es un modal dentro de Sedes: no necesita ruta propia */}
          <Route path="/sedes" element={<Sedes />} />
        </Route>

        {/* --- Rutas de cliente (con tu navbar y footer) --- */}
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/cartelera" element={<div>Cartelera</div>} />
        <Route path="/perfil" element={<div>Perfil</div>} />
        <Route path="/terminos" element={<TerminosCondiciones />} />

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
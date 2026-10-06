import { Routes, Route, useLocation } from 'react-router-dom'
import BarraNavegacion from './componentes/BarraNavegacion'
import PiePagina from './componentes/PiePagina'
import Hero from './componentes/Hero'
import CrearCuenta from './componentes/CrearCuenta'
import IniciarSesion from './componentes/IniciarSesion'
import RecuperarContrasena from './componentes/RecuperarContrasena'
import CambiarContrasena from './componentes/CambiarContrasena'
import Perfil from './componentes/Perfil'

function App() {
  const { pathname } = useLocation()

  const rutasSinNavbar = [
    '/crear-cuenta',
    '/iniciar-sesion',
    '/recuperar-contrasena',
    '/cambiar-contrasena'
  ]

  const ocultarNavbar = rutasSinNavbar.includes(pathname)

  return (
    <>
      {!ocultarNavbar && <BarraNavegacion />}
      <Routes>
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />

        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/cartelera" element={<div>Cartelera</div>} />
        <Route path="/perfil" element={<Perfil />} />         

        <Route path="/peliculas" element={<div>Películas</div>} />
        <Route path="/salas" element={<div>Salas</div>} />
        <Route path="/proyecciones" element={<div>Proyecciones</div>} />
        <Route path="/sedes" element={<div>Sedes</div>} />
        <Route path="/empleados" element={<div>Empleados</div>} />

        <Route path="/" element={<Hero />} />
      </Routes>
      {!ocultarNavbar && <PiePagina />}
    </>
  )
}
export default App
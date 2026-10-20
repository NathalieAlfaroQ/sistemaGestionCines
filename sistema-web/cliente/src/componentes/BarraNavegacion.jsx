import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import Buscador from './Buscador'

const claseEnlace = 'px-3 py-2 md:p-0 block rounded text-text-color text-lg hover:text-brand-soft'

const enlacesCliente = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Cartelera', ruta: '/' },
]

const enlacesTrabajo = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Películas', ruta: '/peliculas' },
  { texto: 'Salas', ruta: '/salas' },
  { texto: 'Proyecciones', ruta: '/proyecciones' },
  { texto: 'Sedes', ruta: '/sedes' },
  { texto: 'Empleados', ruta: '/empleados' },
]

function BarraNavegacion() {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const modoGuardado = sessionStorage.getItem('modoVista')
  const esTrabajador = usuario?.tipoUsuario === 'EMPLEADO' || usuario?.tipoUsuario === 'ADMINISTRADOR'
  const modo = modoGuardado || (esTrabajador ? 'trabajo' : 'cliente')
  const mostrarCliente = modo === 'cliente'
  const mostrarBuscador = mostrarCliente
  const enlaces = mostrarCliente ? enlacesCliente : enlacesTrabajo
  const esTrabajadorEnModoCliente = esTrabajador && mostrarCliente

  const alternarModo = () => {
    const nuevoModo = mostrarCliente ? 'trabajo' : 'cliente'

    sessionStorage.setItem('modoVista', nuevoModo)

    if (nuevoModo === 'trabajo') 
      navigate('/peliculas')
    else 
      navigate('/')
  }

  const cerrarSesion = () => {
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('modoVista')

    setMenuAbierto(false)
    navigate('/iniciar-sesion')
  }

  const handlePerfilClick = () => {
    if (!usuario) 
      navigate('/iniciar-sesion')
    else 
      navigate('/perfil')
  }

  return (
    <nav className="sticky top-4 z-20 mx-4 md:mx-8">
      <div className="max-w-screen-2xl mx-auto px-8 py-4 flex items-center gap-12 bg-navbar rounded-2xl shadow-lg">
        
        <Link to={mostrarCliente ? '/' : '/peliculas'} className="flex items-center gap-3">
          <img src={logo} className="h-16 w-16 rounded object-cover" alt="Logo de Cine Aurora" />
        </Link>

        <ul className="hidden md:flex md:gap-8 flex-col md:flex-row font-medium items-center">
          {enlaces.map((enlace) => (
            <li key={enlace.ruta}>
              <Link to={enlace.ruta} className={claseEnlace}>
                {enlace.texto}
              </Link>
            </li>
          ))}

          {esTrabajador && (
            <li>
              <button type="button" onClick={alternarModo} className={claseEnlace}>
                {mostrarCliente ? 'Trabajo' : 'Comprar'}
              </button>
            </li>
          )}

          {/* Perfil con desplegable */}
          <li
            className="relative"
            onMouseEnter={() => usuario && setMenuAbierto(true)}
            onMouseLeave={() => setMenuAbierto(false)}
          >
            <button
              type="button"
              onClick={handlePerfilClick}
              className={claseEnlace}
            >
              Perfil
            </button>

            {usuario && menuAbierto && (
              <div className="absolute right-0 top-full pt-2 w-44">
                <div className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden py-1">
                
                  {esTrabajadorEnModoCliente && (
                    <button
                      type="button"
                      onClick={alternarModo}
                      className="w-full text-left px-4 py-2 text-sm text-text-color hover:bg-brand transition"
                    >
                      Volver
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="w-full text-left px-4 py-2 text-sm text-text-color hover:bg-brand transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </li>
        </ul>

        {mostrarBuscador && (
          <div className="ml-auto hidden md:block">
            <Buscador placeholder="Buscar" />
          </div>
        )}
      </div>
    </nav>
  )
}
export default BarraNavegacion
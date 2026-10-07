import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import aurora from '../assets/aurora.jpg'
import '../estilos/IniciarSesion.css'

const API_URL = ''

export default function IniciarSesion() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

    const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)

    if (!form.correo.trim() || !form.contrasena.trim()) {
      setMensaje({ tipo: 'error', texto: 'Correo y contraseña son obligatorios' })
      return
    }

    setCargando(true)

    try {
      const res = await fetch(`${API_URL}/api/iniciar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al iniciar sesión' })
        return
      }

      // sessionStorage es para guardar el usuario
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario))

      // Si tene contraseña generada por el sistema, la debe cambiar 
      if (data.usuario.contrasenaTemporal) {
        navigate('/cambiar-contrasena')
        return
      }

      // Cambio dde navbar segun usuario
      if (data.usuario.tipoUsuario === 'ADMINISTRADOR') {
        navigate('/admin')
      } else if (data.usuario.tipoUsuario === 'EMPLEADO') {
        navigate('/empleado')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-container">
      <div className="panel-izquierdo">

        <button
          className="boton-volver"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          ←
        </button>

        <h1 className="titulo-app">Cine Aurora</h1>
        <h2 className="titulo-pantalla">Iniciar Sesión</h2>

        <form onSubmit={handleSubmit} className="form-login" noValidate>
         
          <label className="campo">
          
            <span>Correo</span>
           
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              autoComplete="email"
            />
          </label>

          <label className="campo">

            <span>Contraseña</span>

            <input
              type="password"
              name="contrasena"
              value={form.contrasena}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </label>

          <Link to="/recuperar-contrasena" className="link-recuperar">
            Recuperar contraseña
          </Link>

          <button type="submit" className="boton-ingresar" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

          {mensaje && (
            <p className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>
          )}

          <div className="separador">
            <hr />
            <span>o</span>
            <hr />
          </div>

          <div className="botones-terceros">
            <button type="button" className="boton-tercero" disabled title="Próximamente">
              <span className="icono-google">G</span>
            </button>

            <button type="button" className="boton-tercero" disabled title="Próximamente">
              <span className="icono-facebook">f</span>
            </button>
          </div>

          <p className="texto-crear-cuenta">
            <Link to="/crear-cuenta" className="texto-crear-cuenta">
              Crear cuenta
            </Link>
          </p>
        </form>
      </div>

      <div
        className="panel-derecho"
        style={{ backgroundImage: `url(${aurora})` }}
      />
    </div>
  )
}
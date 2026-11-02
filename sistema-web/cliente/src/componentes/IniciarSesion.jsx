import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import aurora from '../assets/aurora.jpg'
import '../estilos/IniciarSesion.css'
import { guardarSesion } from '../servicios/sesion.js'
import { validarCorreo, MENSAJES_ERROR } from '../validaciones/validaciones'

const API_URL = ''

export default function IniciarSesion() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [errores, setErrores] = useState({ correo: '', contrasena: '' })
  const [tocado, setTocado] = useState({ correo: false, contrasena: false })
  const [errorGlobal, setErrorGlobal] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mostrarContrasena, setMostrarContrasena] = useState(false)

  useEffect(() => {
    setErrores({
      correo: tocado.correo ? validarCorreo(form.correo) : '',
      contrasena: tocado.contrasena && !form.contrasena.trim() ? MENSAJES_ERROR.ESPACIO : ''
    })
  }, [form, tocado])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrorGlobal(null)
  }

  const handleBlur = (e) => {
    setTocado({ ...tocado, [e.target.name]: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal(null)
    setTocado({ correo: true, contrasena: true })

    const hayErroresDeFormato = Object.values(errores).some((error) => error !== '')
    const hayCamposVacios = !form.correo.trim() || !form.contrasena.trim()

    if (hayErroresDeFormato || hayCamposVacios) {
      if (hayCamposVacios) {
        setErrores({
          correo: !form.correo.trim() ? MENSAJES_ERROR.ESPACIO : errores.correo,
          contrasena: !form.contrasena.trim() ? MENSAJES_ERROR.ESPACIO : errores.contrasena
        })
      }

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
        if (res.status === 401 || res.status === 403) {
          setErrorGlobal(MENSAJES_ERROR.CREDENCIALES)

        } else {
          setErrorGlobal(MENSAJES_ERROR.SERVIDOR)
        }
        return
      }

      guardarSesion(data.token, data.usuario)

      if (data.usuario.contrasenaTemporal) {
        navigate('/cambiar-contrasena')
        return
      }

      if (data.usuario.tipoUsuario === 'ADMINISTRADOR' || data.usuario.tipoUsuario === 'EMPLEADO') {
        navigate('/peliculas')
      } else {
        navigate('/')
      }

    } catch (err) {
      console.error(err)
      setErrorGlobal(MENSAJES_ERROR.SERVIDOR)

    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-container">
      <div className="panel-izquierdo">

        <button
          type="button"
          className="boton-volver"
          onClick={() => navigate('/')}
        >
          ←
        </button>

        <div className="header-formulario">
          <h1 className="titulo-app">Cines Aurora</h1>
          <h2 className="titulo-pantalla">Iniciar Sesión</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-login" noValidate>
         
          <label className="campo">
            <span>Correo <span className="asterisco-rojo">*</span></span>

            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
            />

            {errores.correo && <p className="error-texto">{errores.correo}</p>}
          </label>

          <label className="campo">
            <span>Contraseña <span className="asterisco-rojo">*</span></span>

            <div className="input-con-icono">
              <input
                type={mostrarContrasena ? "text" : "password"}
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="current-password"
              />

              <button 
                type="button" 
                className="boton-ojo" 
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                tabIndex="-1"
              >
                {mostrarContrasena ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {errores.contrasena && <p className="error-texto">{errores.contrasena}</p>}
          </label>

          <Link to="/recuperar-contrasena" className="link-recuperar">
            Recuperar contraseña
          </Link>

          {errorGlobal && (
            <p className="error-texto" style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>
              {errorGlobal}
            </p>
          )}

          <p className="obligatorio-texto">* Espacio obligatorio</p>

          <button type="submit" className="boton-ingresar" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

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

      <div className="panel-derecho" style={{ backgroundImage: `url(${aurora})` }} />
    </div>
  )
}
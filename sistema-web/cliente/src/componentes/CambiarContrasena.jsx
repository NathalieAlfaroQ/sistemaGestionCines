import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import aurora from '../assets/aurora.jpg'
import '../estilos/CambiarContrasena.css'

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const usuarioGuardado = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const correoInicial = usuarioGuardado?.correo || ''
  const esTemporal = usuarioGuardado?.contrasenaTemporal === true

  const [form, setForm] = useState({
    contrasenaTemporal: '',
    contrasenaNueva: '',
    confirmar: ''
  })

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)

    if (!form.contrasenaTemporal || !form.contrasenaNueva || !form.confirmar) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos son obligatorios' })
      return
    }

    if (form.contrasenaNueva !== form.confirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' })
      return
    }

    if (form.contrasenaNueva.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres' })
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/cambiar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correoInicial,
          contrasenaTemporal: form.contrasenaTemporal,
          contrasenaNueva: form.contrasenaNueva
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al cambiar la contraseña' })
        return
      }

      setMensaje({ tipo: 'ok', texto: 'Contraseña actualizada. Redirigiendo...' })

      if (usuarioGuardado) {
        usuarioGuardado.contrasenaTemporal = false
        sessionStorage.setItem('usuario', JSON.stringify(usuarioGuardado))
      }

      setTimeout(() => {
        if (esTemporal) {
          // Primera vez inicia sesion
          const tipo = usuarioGuardado?.tipoUsuario

          if (tipo === 'ADMINISTRADOR' || tipo === 'EMPLEADO') 
            navigate('/peliculas')
          else 
            navigate('/')

        } else {
          navigate('/perfil')
        }
      }, 1500)
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="cambiar-container">
      <div className="panel-izquierdo">

        <h1 className="titulo-app">Cine Aurora</h1>
        <h2 className="titulo-pantalla">Cambiar Contraseña</h2>

        <form onSubmit={handleSubmit} className="form-cambiar" noValidate>
         
          <label className="campo">
            <span>
              {esTemporal ? 'Contraseña temporal' : 'Contraseña actual'}
            </span>

            <input
              type="password"
              name="contrasenaTemporal"
              value={form.contrasenaTemporal}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </label>

          <label className="campo">
            <span>Contraseña nueva</span>

            <input
              type="password"
              name="contrasenaNueva"
              value={form.contrasenaNueva}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          <label className="campo">
            <span>Confirmar contraseña</span>

            <input
              type="password"
              name="confirmar"
              value={form.confirmar}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className="boton-guardar" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar'}
          </button>

          {mensaje && (
            <p className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>
          )}
        </form>
      </div>
      <div
        className="panel-derecho"
        style={{ backgroundImage: `url(${aurora})` }}
      />
    </div>
  )
}
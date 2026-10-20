import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import aurora from '../assets/aurora.jpg'
import '../estilos/RecuperarContrasena.css'

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)

    if (!correo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Debe digitar un correo' })
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/recuperar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al enviar' })
      } else {
        setMensaje({
          tipo: 'ok',
          texto: 'Si el correo está registrado, recibirás una contraseña temporal.'
        })

        setCorreo('')
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="recuperar-container">
      <div className="panel-izquierdo">

        <button
          className="boton-volver"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          ←
        </button>

        <h1 className="titulo-app">Cine Aurora</h1>
        <h2 className="titulo-pantalla">Recuperar Contraseña</h2>

        <p className="descripcion">
          Digite el correo de su cuenta para enviarle una contraseña temporal y pueda restablecer su contraseña.
        </p>

        <form onSubmit={handleSubmit} className="form-recuperar" noValidate>
          <label className="campo">
            <span>Correo</span>
            
            <input
              type="email"
              name="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
            />
          </label>

          <button type="submit" className="boton-enviar" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar'}
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
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import aurora from '../assets/aurora.jpg'
import '../estilos/RecuperarContrasena.css'
import { validarCorreo, MENSAJES_ERROR } from '../validaciones/validaciones'

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [tocado, setTocado] = useState(false)
  const [errorCorreo, setErrorCorreo] = useState('')
  const [errorGlobal, setErrorGlobal] = useState(null)
  const [mensajeExito, setMensajeExito] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (tocado) {
      setErrorCorreo(validarCorreo(correo))
    }
  }, [correo, tocado])

  const handleBlur = () => {
    setTocado(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal(null)
    setMensajeExito(null)
    setTocado(true)

    const errorValidacion = validarCorreo(correo)
    if (errorValidacion) {
      setErrorCorreo(errorValidacion)
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
        if (res.status === 404) {
          setErrorGlobal('X Correo inválido')
        } else {
          setErrorGlobal(data.error || MENSAJES_ERROR.SERVIDOR)
        }
      } else {
        setMensajeExito('Si el correo está registrado, recibirás una contraseña temporal.')
        setCorreo('')
        setTocado(false)
      }
    } catch (err) {
      console.error(err)
      setErrorGlobal(MENSAJES_ERROR.SERVIDOR)
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

        <div className="header-formulario">
          <h1 className="titulo-app">Cine Aurora</h1>
          <h2 className="titulo-pantalla">Recuperar Contraseña</h2>
        </div>

        <p className="descripcion">
          Digite el correo de su cuenta para enviarle una contraseña temporal y pueda restablecer su contraseña.
        </p>

        <form onSubmit={handleSubmit} className="form-recuperar" noValidate>
          <label className="campo">
            <span>Correo <span className="asterisco-rojo">*</span></span>
            <input
              type="email"
              name="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              onBlur={handleBlur}
              autoComplete="email"
            />
            {errorCorreo && <p className="error-texto">{errorCorreo}</p>}
          </label>

          {errorGlobal && (
            <p className="error-texto" style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>
              {errorGlobal}
            </p>
          )}

          {mensajeExito && (
            <p className="exito-texto" style={{ color: '#4ade80', fontSize: '13px', marginTop: '8px' }}>
              {mensajeExito}
            </p>
          )}

          <p className="obligatorio-texto">* Espacio obligatorio</p>

          <button type="submit" className="boton-enviar" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar'}
          </button>

     
        </form>
      </div>

      <div
        className="panel-derecho"
        style={{ backgroundImage: `url(${aurora})` }}
      />
    </div>
  )
}
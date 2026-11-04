import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import aurora from '../assets/aurora.jpg'
import '../estilos/CambiarContrasena.css'
import { validarContrasenaFuerte, MENSAJES_ERROR } from '../validaciones/validaciones'

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const usuarioGuardado = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const correoInicial = usuarioGuardado?.correo || ''
  const [form, setForm] = useState({
    contrasenaNueva: '',
    confirmar: ''
  })
  
  const [verNueva, setVerNueva] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [errores, setErrores] = useState({ contrasenaNueva: '', confirmar: '' })
  const [tocado, setTocado] = useState({ contrasenaNueva: false, confirmar: false })
  const [errorGlobal, setErrorGlobal] = useState(null)
  const [mensajeExito, setMensajeExito] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    let errNueva = ''
    if (tocado.contrasenaNueva) {
      errNueva = validarContrasenaFuerte(form.contrasenaNueva)
    }

    let errConf = ''
    if (tocado.confirmar) {
      if (!form.confirmar) {
        errConf = MENSAJES_ERROR.ESPACIO
      } else if (form.confirmar !== form.contrasenaNueva) {
        errConf = MENSAJES_ERROR.NO_COINCIDEN
      }
    }

    setErrores({ contrasenaNueva: errNueva, confirmar: errConf })
  }, [form, tocado])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrorGlobal(null)
    setMensajeExito(null)
  }

  const handleBlur = (e) => {
    setTocado({ ...tocado, [e.target.name]: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal(null)
    setMensajeExito(null)

    setTocado({ contrasenaNueva: true, confirmar: true })

    const hayErrores = Object.values(errores).some((error) => error !== '')
    const hayVacios = !form.contrasenaNueva || !form.confirmar

    if (hayErrores || hayVacios) {
      if (hayVacios) {
        setErrores({
          contrasenaNueva: !form.contrasenaNueva ? MENSAJES_ERROR.ESPACIO : errores.contrasenaNueva,
          confirmar: !form.confirmar ? MENSAJES_ERROR.ESPACIO : errores.confirmar
        })
      }
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/cambiar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correoInicial,
          contrasenaNueva: form.contrasenaNueva
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorGlobal(data.error || MENSAJES_ERROR.SERVIDOR)
        return
      }

      setMensajeExito('Contraseña actualizada')
      
      if (usuarioGuardado) {
        usuarioGuardado.contrasenaTemporal = false
        sessionStorage.setItem('usuario', JSON.stringify(usuarioGuardado))
      }

      setTimeout(() => {
        if (usuarioGuardado?.tipoUsuario === 'ADMINISTRADOR' || usuarioGuardado?.tipoUsuario === 'EMPLEADO') {
          navigate('/peliculas')
        } else {
          navigate('/')
        }
      }, 1500)
      
    } catch {
      setErrorGlobal(MENSAJES_ERROR.SERVIDOR)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="cambiar-container">
      <div className="panel-izquierdo">
        
        <div className="header-formulario">
          <h1 className="titulo-app">Cines Aurora</h1>
          <h2 className="titulo-pantalla">Cambiar Contraseña</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-cambiar" noValidate>
          
          <label className="campo">
            <span>Contraseña nueva <span className="asterisco-rojo">*</span></span>
            <div className="input-con-icono">
              <input
                type={verNueva ? "text" : "password"}
                name="contrasenaNueva"
                value={form.contrasenaNueva}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
              />
              <button type="button" className="boton-ojo" onClick={() => setVerNueva(!verNueva)} tabIndex="-1">
                {verNueva ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errores.contrasenaNueva && <p className="error-texto">{errores.contrasenaNueva}</p>}
          </label>

          <label className="campo">
            <span>Confirmar contraseña <span className="asterisco-rojo">*</span></span>
            <div className="input-con-icono">
              <input
                type={verConfirmar ? "text" : "password"}
                name="confirmar"
                value={form.confirmar}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
              />
              <button type="button" className="boton-ojo" onClick={() => setVerConfirmar(!verConfirmar)} tabIndex="-1">
                {verConfirmar ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errores.confirmar && <p className="error-texto">{errores.confirmar}</p>}
          </label>

          {errorGlobal && (
            <p className="error-texto" style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>
              {errorGlobal}
            </p>
          )}

          {mensajeExito && (
            <p className="exito-texto">
              {mensajeExito}
            </p>
          )}

          <p className="obligatorio-texto">* Espacio obligatorio</p>

          <button type="submit" className="boton-guardar" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Cambiar'}
          </button>
        </form>
      </div>

      <div className="panel-derecho" style={{ backgroundImage: `url(${aurora})` }} />
    </div>
  )
}
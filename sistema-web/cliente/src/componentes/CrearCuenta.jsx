import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../estilos/CrearCuenta.css'
import { validarNombreOApellido, validarCorreo } from '../utilidades/validaciones'

const API_URL = ''

export default function CrearCuenta() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '' })
  const [errores, setErrores] = useState({ nombre: '', apellido: '', correo: '' })
  // Guarda errores como correo duplicado
  const [errorGlobal, setErrorGlobal] = useState(null)
  const [cargando, setCargando] = useState(false)

  // Verificar cuando el usuario digita
  useEffect(() => {
    setErrores({
      nombre: validarNombreOApellido(form.nombre),
      apellido: validarNombreOApellido(form.apellido),
      correo: validarCorreo(form.correo)
    })
  }, [form])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Quitar error del usuario digitado
    setErrorGlobal(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal(null)

    // Verificamos si hay algún error antes de enviar
    const hayErrores = Object.values(errores).some((error) => error !== '')
    const hayVacios = !form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()

    if (hayErrores || hayVacios) {
      if (hayVacios) setErrorGlobal('Espacio obligatorio')
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/crear-cuenta/cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrorGlobal('Correo inválido')
        } else {
          setErrorGlobal(data.error || 'Error al desplegar, intente luego.')
        }
      } else {
        setForm({ nombre: '', apellido: '', correo: '' })
        navigate('/iniciar-sesion') 
      }
    } catch (err) {
      console.error(err)
      setErrorGlobal('Error al desplegar, intente luego.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="registro-container">
      <div className="panel-izquierdo">

        <button className="boton-volver" onClick={() => navigate(-1)} aria-label="Volver">
          ←
        </button>

        <h1 className="titulo-app">Cines Aurora</h1>
        <h2 className="titulo-pantalla">Crear Cuenta</h2>

        <form onSubmit={handleSubmit} className="form-registro" noValidate>
          
          <label className="campo">
            <span>Nombre <span className="asterisco-rojo">*</span></span>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              autoComplete="given-name"
            />
            {errores.nombre && <p className="error-texto">✖ {errores.nombre}</p>}
          </label>

          <label className="campo">
            <span>Apellido <span className="asterisco-rojo">*</span></span>
            <input
              type="text"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              autoComplete="family-name"
            />
            {errores.apellido && <p className="error-texto">✖ {errores.apellido}</p>}
          </label>

          <label className="campo">
            <span>Correo <span className="asterisco-rojo">*</span></span>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              autoComplete="email"
            />
            {errores.correo && <p className="error-texto">✖ {errores.correo}</p>}
          </label>

          {errorGlobal && (
            <p className="error-texto" style={{ marginTop: '10px', fontWeight: 'bold' }}>
              ✖ {errorGlobal}
            </p>
          )}

          <p className="obligatorio-texto">* Espacio obligatorio</p>

          <button type="submit" className="boton-crear" disabled={cargando}>
            {cargando ? 'Creando...' : 'Crear'}
          </button>
        </form>
      </div>
      <div className="panel-derecho" />
    </div>
  )
}
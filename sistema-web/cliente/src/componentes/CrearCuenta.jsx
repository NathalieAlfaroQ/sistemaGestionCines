import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../estilos/CrearCuenta.css'
import { validarNombreOApellido, validarCorreo } from '../validaciones/validaciones'

const API_URL = ''

export default function CrearCuenta() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '' })
  const [errores, setErrores] = useState({ nombre: '', apellido: '', correo: '' })
  const [tocado, setTocado] = useState({ nombre: false, apellido: false, correo: false })
  const [errorGlobal, setErrorGlobal] = useState(null)
  const [mensajeExito, setMensajeExito] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setErrores({
      nombre: tocado.nombre ? validarNombreOApellido(form.nombre) : '',
      apellido: tocado.apellido ? validarNombreOApellido(form.apellido) : '',
      correo: tocado.correo ? validarCorreo(form.correo) : ''
    })
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
    setTocado({ nombre: true, apellido: true, correo: true })

    const hayErroresDeFormato = Object.values(errores).some((error) => error !== '')
    const hayCamposVacios = !form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()

    if (hayErroresDeFormato || hayCamposVacios) {
      if (hayCamposVacios) {
        setErrores({
          nombre: !form.nombre.trim() ? 'Espacio obligatorio' : errores.nombre,
          apellido: !form.apellido.trim() ? 'Espacio obligatorio' : errores.apellido,
          correo: !form.correo.trim() ? 'Espacio obligatorio' : errores.correo
        })
      }
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
          setErrorGlobal('X Correo inválido')
        } else {
          setErrorGlobal('Error al cargar la pantalla, intenta luego.')
        }
      } else {
        setMensajeExito('Cuenta creada, revisa tu correo.')
        setForm({ nombre: '', apellido: '', correo: '' })
        setTocado({ nombre: false, apellido: false, correo: false }) 
      }

    } catch (err) {
      console.error(err)
      setErrorGlobal('Error al cargar la pantalla, intenta luego.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="registro-container">
      <div className="panel-izquierdo">

        <button 
          type="button"
          className="boton-volver" 
          onClick={() => navigate('/iniciar-sesion')} 
        >
          ←
        </button>

        <div className="header-formulario">
          <h1 className="titulo-app">Cines Aurora</h1>
          <h2 className="titulo-pantalla">Crear Cuenta</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-registro" noValidate>
          <label className="campo">
            <span>Nombre <span className="asterisco-rojo">*</span></span>
            
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="given-name"
            />

            {errores.nombre && <p className="error-texto">{errores.nombre}</p>}
          </label>

          <label className="campo">
            <span>Apellido <span className="asterisco-rojo">*</span></span>
           
            <input
              type="text"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="family-name"
            />

            {errores.apellido && <p className="error-texto">{errores.apellido}</p>}
          </label>

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

          {errorGlobal && (
            <p className="error-texto">
              {errorGlobal}
            </p>
          )}

          {mensajeExito && (
            <p className="exito-texto">
              {mensajeExito}
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
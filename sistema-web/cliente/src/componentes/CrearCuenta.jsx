import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../estilos/CrearCuenta.css'

const API_URL = ''

export default function CrearCuenta() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '' })
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)

    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos son obligatorios' })
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
        setMensaje({ tipo: 'error', texto: data.error || 'Error al crear la cuenta' })
      } else {
        setMensaje({
          tipo: 'ok',
          texto: 'Cuenta creada. Revisa tu correo para la contraseña temporal.'
        })

        setForm({ nombre: '', apellido: '', correo: '' })
      }
    } catch (err) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="registro-container">
      <div className="panel-izquierdo">

        <button
          className="boton-volver"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          ←
        </button>

        <h1 className="titulo-app">Cine Aurora</h1>
        <h2 className="titulo-pantalla">Crear Cuenta</h2>

        <form onSubmit={handleSubmit} className="form-registro" noValidate>
          
          <label className="campo">
            <span>Nombre</span>

            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              autoComplete="given-name"
            />
          </label>

          <label className="campo">
            <span>Apellido</span>

            <input
              type="text"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              autoComplete="family-name"
            />
          </label>

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

          <button type="submit" className="boton-crear" disabled={cargando}>
            {cargando ? 'Creando...' : 'Crear'}
          </button>

          {mensaje && (
            <p className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>
          )}
        </form>
      </div>
      <div className="panel-derecho" />
    </div>
  )
}
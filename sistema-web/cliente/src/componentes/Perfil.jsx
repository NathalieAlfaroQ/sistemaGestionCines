import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../estilos/Perfil.css'

export default function Perfil() {
  const navigate = useNavigate()
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')

  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
  })

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  if (!usuario) {
    // Si presiona Perfil sin sesion iniciada, le pide que inicie sesion
    navigate('/iniciar-sesion')
    return null
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const cancelarEdicion = () => {
    setEditando(false)
    setForm({ nombre: usuario.nombre, apellido: usuario.apellido })
    setMensaje(null)
  }

  const guardarCambios = async () => {
    setMensaje(null)

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setMensaje({ tipo: 'error', texto: 'Nombre y apellido no pueden quedar vacíos' })
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCredencial: usuario.idCredencial,
          nombre: form.nombre,
          apellido: form.apellido
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al guardar' })
        return
      }

      const usuarioActualizado = { ...usuario, nombre: form.nombre, apellido: form.apellido }
      sessionStorage.setItem('usuario', JSON.stringify(usuarioActualizado))

      setEditando(false)
      setMensaje({ tipo: 'ok', texto: 'Datos actualizados correctamente' })

    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="perfil-container">
      <div className="perfil-contenido">
        <div className="perfil-header">

          <h1 className="perfil-titulo">Perfil</h1>

          {!editando ? (
            <button
              type="button"
              className="perfil-editar"
              onClick={() => setEditando(true)}
            >
              Editar
            </button>
          ) : (
            <div className="perfil-acciones">
              <button
                type="button"
                className="perfil-cancelar"
                onClick={cancelarEdicion}
                disabled={cargando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="perfil-guardar"
                onClick={guardarCambios}
                disabled={cargando}
              >
                {cargando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        <div className="campo">
          <span>Nombre</span>

          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            disabled={!editando}
          />
        </div>

        <div className="campo">
          <span>Apellido</span>

          <input
            type="text"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            disabled={!editando}
          />
        </div>

        <div className="campo">
          <span>Correo</span>
          
          <input
            type="email"
            value={usuario.correo}
            disabled
          />
        </div>

        <button
          type="button"
          className="boton-cambiar-contrasena"
          onClick={() => navigate('/cambiar-contrasena')}
        >
          Cambiar contraseña
        </button>

        {mensaje && (
          <p className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>
        )}
      </div>
    </div>
  )
}
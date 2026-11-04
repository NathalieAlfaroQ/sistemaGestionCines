import { useState, useEffect } from 'react'
import { crearUsuarioInterno } from '../servicios/servicioEmpleados.js'
import FormularioUsuario from './FormularioUsuario.jsx'
import ModalFormulario from '../common/ModalFormulario.jsx'

function CrearUsuario({ alCancelar, alCrear }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [sedes, setSedes] = useState([])

  // Cargar las sedes para el desplegable del formulario
  useEffect(() => {
    async function cargarSedes() {
      try {
        const res = await fetch('/api/sedes') 

        if (res.ok) {
          const data = await res.json()
          setSedes(data)
        }

      } catch (err) {
        console.error("Error cargando sedes: ", err)
      }
    }
    cargarSedes()
  }, [])

  async function guardar(datos) {
    setGuardando(true)
    setError(null)

    try {
      await crearUsuarioInterno(datos)
      alCrear() 
    } catch (error) {
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ModalFormulario titulo="Crear usuario" alCerrar={alCancelar}>
      <FormularioUsuario
        sedes={sedes}
        alEnviar={guardar}
        alCancelar={alCancelar}
        guardando={guardando}
        error={error}
      />
    </ModalFormulario>
  )
}

export default CrearUsuario
import { useState } from 'react'
import { crearUsuarioInterno } from '../servicios/servicioEmpleados.js'
import { useSedes } from '../ganchos/useSedes.js'
import FormularioUsuario from './FormularioUsuario.jsx'
import ModalFormulario from '../common/ModalFormulario.jsx'

function CrearUsuario({ alCancelar, alCrear }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const { sedes } = useSedes()

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
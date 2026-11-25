import { useState } from 'react'
import { crearProducto } from '../servicios/servicioDulceria.js'
import FormularioProducto from './FormularioProducto.jsx'
import ModalFormulario from '../common/ModalFormulario.jsx'

function CrearProducto({ alCancelar, alCrear }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  async function guardar(datos) {
    setGuardando(true)
    setError(null)
    try {
      await crearProducto(datos)
      alCrear()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ModalFormulario titulo="Crear producto" alCerrar={alCancelar}>
      <FormularioProducto alEnviar={guardar} alCancelar={alCancelar} guardando={guardando} error={error} />
    </ModalFormulario>
  )
}
export default CrearProducto
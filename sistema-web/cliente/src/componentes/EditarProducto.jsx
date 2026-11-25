import { useState } from 'react'
import { editarProducto } from '../servicios/servicioDulceria.js'
import FormularioProducto from './FormularioProducto.jsx'
import ModalFormulario from '../common/ModalFormulario.jsx'

function EditarProducto({ producto, alCancelar, alEditar }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  async function guardar(datos) {
    setGuardando(true)
    setError(null)
    try {
      await editarProducto(producto.idCantidadProducto, datos)
      alEditar()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ModalFormulario titulo="Editar producto" alCerrar={alCancelar}>
      <FormularioProducto
        valorInicial={{ nombre: producto.nombre, precio: producto.precio, cantidad: producto.cantidad }}
        textoGuardar="Guardar cambios"
        alEnviar={guardar} alCancelar={alCancelar} guardando={guardando} error={error}
      />
    </ModalFormulario>
  )
}
export default EditarProducto
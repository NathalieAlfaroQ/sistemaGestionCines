import { useState } from 'react'
import { validarNombreProducto, validarPrecio, validarCantidad } from '../validaciones/validaciones'
import { claseBotonPrincipal, claseBotonSecundario } from '../constantes/clasesFormulario.js'

function FormularioProducto({ valorInicial, textoGuardar = 'Crear', alEnviar, alCancelar, guardando, error }) {
  const [form, setForm] = useState({
    nombre: valorInicial?.nombre ?? '',
    precio: valorInicial?.precio ?? '',
    cantidad: valorInicial?.cantidad ?? ''
  })
  const [errores, setErrores] = useState({ nombre: '', precio: '', cantidad: '' })
  const [tocado, setTocado] = useState({ nombre: false, precio: false, cantidad: false })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleBlur = (e) => setTocado({ ...tocado, [e.target.name]: true })

  function manejarEnvio(e) {
    e.preventDefault()
    setTocado({ nombre: true, precio: true, cantidad: true })

    const errNom = validarNombreProducto(form.nombre)
    const errPre = validarPrecio(form.precio)
    const errCan = validarCantidad(form.cantidad)
    setErrores({ nombre: errNom, precio: errPre, cantidad: errCan })

    if (errNom || errPre || errCan) return
    alEnviar(form)
  }

  return (
    <form onSubmit={manejarEnvio} className="flex max-w-sm flex-col gap-6">
      <div>
        <label htmlFor="nombre" className="block mb-2 text-sm font-medium text-white">Nombre del producto *</label>
        <input
          id="nombre"
          name="nombre" value={form.nombre} onChange={handleChange} onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        />
        {tocado.nombre && errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
      </div>
      <div>
        <label htmlFor="precio" className="block mb-2 text-sm font-medium text-white">Precio *</label>
        <input
          id="precio"
          type="number" step="0.01" name="precio" value={form.precio} onChange={handleChange} onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        />
        {tocado.precio && errores.precio && <p className="text-red-500 text-xs mt-1">{errores.precio}</p>}
      </div>
      <div>
        <label htmlFor="cantidad" className="block mb-2 text-sm font-medium text-white">Cantidad *</label>
        <input
          id="cantidad"
          type="number" name="cantidad" value={form.cantidad} onChange={handleChange} onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        />
        {tocado.cantidad && errores.cantidad && <p className="text-red-500 text-xs mt-1">{errores.cantidad}</p>}
      </div>
      {error && <p className="text-red-500 text-sm font-bold mt-2">{error}</p>}
      <div className="flex gap-4">
        <button type="submit" className={claseBotonPrincipal} disabled={guardando}>
          {guardando ? 'Guardando...' : textoGuardar}
        </button>
        <button type="button" onClick={alCancelar} className={claseBotonSecundario} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default FormularioProducto
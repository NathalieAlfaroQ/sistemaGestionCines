import { useState, useEffect } from 'react'
import { POS_SEDE } from '../constantes/posicionesSede.js'
import { validarNombreOApellido, validarCorreo, MENSAJES_ERROR } from '../validaciones/validaciones'
import { claseBotonPrincipal, claseBotonSecundario } from '../constantes/clasesFormulario.js'

function FormularioUsuario({ valorInicial, textoGuardar = 'Crear', sedes = [], alEnviar, alCancelar, guardando, error }) {
  const [form, setForm] = useState({
    nombre: valorInicial?.nombre ?? '',
    apellido: valorInicial?.apellido ?? '',
    correo: valorInicial?.correo ?? '',
    tipoUsuario: valorInicial?.tipoUsuario ?? '',
    idSede: valorInicial?.idSede ? String(valorInicial.idSede) : ''
  })

  const [errores, setErrores] = useState({ nombre: '', apellido: '', correo: '', tipoUsuario: '', idSede: '' })
  const [tocado, setTocado] = useState({ nombre: false, apellido: false, correo: false, tipoUsuario: false, idSede: false })

  useEffect(() => {
    let errNom = tocado.nombre ? validarNombreOApellido(form.nombre) : ''
    let errApe = tocado.apellido ? validarNombreOApellido(form.apellido) : ''
    let errCor = tocado.correo ? validarCorreo(form.correo) : ''
    let errRol = tocado.tipoUsuario && !form.tipoUsuario ? MENSAJES_ERROR.ESPACIO : ''
    let errSed = tocado.idSede && !form.idSede ? MENSAJES_ERROR.ESPACIO : ''

    setErrores({ nombre: errNom, apellido: errApe, correo: errCor, tipoUsuario: errRol, idSede: errSed })
  }, [form, tocado])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleBlur = (e) => {
    setTocado({ ...tocado, [e.target.name]: true })
  }

  const manejarEnvio = (e) => {
    e.preventDefault()
    
    setTocado({ nombre: true, apellido: true, correo: true, tipoUsuario: true, idSede: true })

    const hayErrores = Object.values(errores).some((err) => err !== '')
    const hayVacios = !form.nombre || !form.apellido || !form.correo || !form.tipoUsuario || !form.idSede

    if (hayErrores || hayVacios) {
      return
    }

    alEnviar(form)
  }

  return (
    <form onSubmit={manejarEnvio} className="flex max-w-sm flex-col gap-6">
      
      <div>
        <label className="block mb-2 text-sm font-medium text-white">Nombre <span className="text-red-500">*</span></label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        />
        {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-white">Apellido <span className="text-red-500">*</span></label>
        <input
          name="apellido"
          value={form.apellido}
          onChange={handleChange}
          onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        />
        {errores.apellido && <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-white">Correo <span className="text-red-500">*</span></label>
        <input
          type="email"
          name="correo"
          value={form.correo}
          onChange={handleChange}
          onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        />
        {errores.correo && <p className="text-red-500 text-xs mt-1">{errores.correo}</p>}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-white">Rol <span className="text-red-500">*</span></label>
        <select
          name="tipoUsuario"
          value={form.tipoUsuario}
          onChange={handleChange}
          onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        >
          <option value="">Seleccione un rol</option>
          <option value="EMPLEADO">Empleado</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>
        {errores.tipoUsuario && <p className="text-red-500 text-xs mt-1">{errores.tipoUsuario}</p>}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-white">Sede <span className="text-red-500">*</span></label>
        <select
          name="idSede"
          value={form.idSede}
          onChange={handleChange}
          onBlur={handleBlur}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-md block w-full p-2.5"
        >
          <option value="">Seleccione una sede</option>
          {sedes.map((sede) => (
            <option key={sede[POS_SEDE.id]} value={sede[POS_SEDE.id]}>
              {sede[POS_SEDE.nombre]}
            </option>
          ))}
        </select>
        {errores.idSede && <p className="text-red-500 text-xs mt-1">{errores.idSede}</p>}
      </div>

      {error && <p className="text-red-500 text-sm font-bold mt-2">{error}</p>}

      <div className="flex gap-4">
        <button 
          type="submit" 
          className={claseBotonPrincipal}
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : textoGuardar}
        </button>
        
        <button 
          type="button" 
          onClick={alCancelar}
          className={claseBotonSecundario}
          disabled={guardando}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default FormularioUsuario
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/servicios/servicioDescuento.js', () => ({ desactivarDescuento: vi.fn(), obtenerDescuentos: vi.fn(), registrarDescuento: vi.fn() }))

import * as servicio from '../../src/servicios/servicioDescuento.js'
import { crearDescuento, eliminarDescuento, listarDescuentos } from '../../src/controladores/controladorDescuento.js'
import { ErrorConflicto } from '../../src/errores/ErrorConflicto.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

function crearRes() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listarDescuentos', () => {
  it('responde con la lista y pasa los filtros del query al servicio', async () => {
    servicio.obtenerDescuentos.mockResolvedValue([[1, 'Lunes de cine']])
    const query = { busqueda: 'lunes', idSede: '4', idPelicula: '7', fechaInicio: '2026-11-16', fechaFin: '2026-11-22', estado: 'todos' }
    const res = crearRes()

    await listarDescuentos({ query }, res)

    expect(servicio.obtenerDescuentos).toHaveBeenCalledWith(query)
    expect(res.json).toHaveBeenCalledWith([[1, 'Lunes de cine']])
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 400 con el mensaje cuando un filtro no es válido', async () => {
    servicio.obtenerDescuentos.mockRejectedValue(new ErrorValidacion('El filtro de cine no es válido'))
    const res = crearRes()

    await listarDescuentos({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El filtro de cine no es válido' })
  })

  it('responde 500 con el mensaje de la historia si falla la carga', async () => {
    servicio.obtenerDescuentos.mockRejectedValue(new Error('ORA-00942'))
    const res = crearRes()

    await listarDescuentos({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo cargar la lista de descuentos, reintente después' })
  })
})

describe('crearDescuento', () => {
  it('responde 201 con el id del descuento creado', async () => {
    servicio.registrarDescuento.mockResolvedValue(15)
    const body = { nombre: 'Lunes de cine' }
    const res = crearRes()

    await crearDescuento({ body }, res)

    expect(servicio.registrarDescuento).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ idDescuento: 15 })
  })

  it('responde 400 con el mensaje de validación', async () => {
    servicio.registrarDescuento.mockRejectedValue(new ErrorValidacion('El nombre es obligatorio'))
    const res = crearRes()

    await crearDescuento({ body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El nombre es obligatorio' })
  })

  it('responde 409 cuando el descuento choca con otro', async () => {
    servicio.registrarDescuento.mockRejectedValue(new ErrorConflicto('Ya existe un descuento'))
    const res = crearRes()

    await crearDescuento({ body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Ya existe un descuento' })
  })

  it('responde 500 con un mensaje fijo ante un error inesperado', async () => {
    servicio.registrarDescuento.mockRejectedValue(new Error('ORA-00001'))
    const res = crearRes()

    await crearDescuento({ body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo crear el descuento' })
  })
})

describe('eliminarDescuento', () => {
  it('responde con el id del descuento eliminado', async () => {
    servicio.desactivarDescuento.mockResolvedValue()
    const res = crearRes()

    await eliminarDescuento({ params: { id: '7' } }, res)

    expect(servicio.desactivarDescuento).toHaveBeenCalledWith('7')
    expect(res.json).toHaveBeenCalledWith({ idDescuento: 7 })
  })

  it('responde 400 si el identificador no es válido', async () => {
    servicio.desactivarDescuento.mockRejectedValue(new ErrorValidacion('El identificador del descuento no es válido'))
    const res = crearRes()

    await eliminarDescuento({ params: { id: 'x' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El identificador del descuento no es válido' })
  })

  it('responde 404 si no existe o ya fue eliminado', async () => {
    servicio.desactivarDescuento.mockRejectedValue(new ErrorNoEncontrado('El descuento no existe o ya fue eliminado'))
    const res = crearRes()

    await eliminarDescuento({ params: { id: '7' } }, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El descuento no existe o ya fue eliminado' })
  })

  it('responde 500 con un mensaje fijo ante un error inesperado', async () => {
    servicio.desactivarDescuento.mockRejectedValue(new Error('ORA-12345'))
    const res = crearRes()

    await eliminarDescuento({ params: { id: '7' } }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo eliminar el descuento' })
  })
})
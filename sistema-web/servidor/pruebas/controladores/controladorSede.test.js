import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/servicios/servicioSede.js', () => ({
  desactivarSede: vi.fn(),
  modificarSede: vi.fn(),
  obtenerSedes: vi.fn(),
  registrarSede: vi.fn(),
}))

import * as servicio from '../../src/servicios/servicioSede.js'
import {
  crearSede,
  editarSede,
  eliminarSede,
  listarSedes,
} from '../../src/controladores/controladorSede.js'
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

describe('listarSedes', () => {
  it('responde con la lista y pasa los filtros del query al servicio', async () => {
    servicio.obtenerSedes.mockResolvedValue([[1, 'Cine Aurora']])
    const query = { busqueda: 'a', nombre: 'b', idProvincia: '1', idCanton: '2', estado: 'todas' }
    const res = crearRes()

    await listarSedes({ query }, res)

    expect(servicio.obtenerSedes).toHaveBeenCalledWith(query)
    expect(res.json).toHaveBeenCalledWith([[1, 'Cine Aurora']])
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 200 con lista vacía cuando no hay sedes', async () => {
    servicio.obtenerSedes.mockResolvedValue([])
    const res = crearRes()

    await listarSedes({ query: {} }, res)

    expect(res.json).toHaveBeenCalledWith([])
  })

  it('responde 400 con el mensaje de un ErrorValidacion', async () => {
    servicio.obtenerSedes.mockRejectedValue(new ErrorValidacion('El filtro de estado no es válido'))
    const res = crearRes()

    await listarSedes({ query: { estado: 'x' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El filtro de estado no es válido' })
  })

  it('responde 500 genérico ante un error inesperado, sin exponer el detalle', async () => {
    servicio.obtenerSedes.mockRejectedValue(new Error('ORA-03113 detalle interno'))
    const res = crearRes()

    await listarSedes({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudieron obtener las sedes' })
    expect(console.error).toHaveBeenCalled()
  })
})

describe('crearSede', () => {
  it('responde 201 con el id de la sede creada', async () => {
    servicio.registrarSede.mockResolvedValue(21)
    const body = { nombre: 'Cine Aurora San Pedro', idCanton: 3 }
    const res = crearRes()

    await crearSede({ body }, res)

    expect(servicio.registrarSede).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ idSede: 21 })
  })

  it('responde 400 con el mensaje de un ErrorValidacion', async () => {
    servicio.registrarSede.mockRejectedValue(new ErrorValidacion('Ya existe una sede con ese nombre'))
    const res = crearRes()

    await crearSede({ body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Ya existe una sede con ese nombre' })
  })

  it('responde 500 genérico ante un error inesperado', async () => {
    servicio.registrarSede.mockRejectedValue(new Error('detalle interno'))
    const res = crearRes()

    await crearSede({ body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo crear la sede' })
    expect(console.error).toHaveBeenCalled()
  })
})

describe('editarSede', () => {
  const body = { nombre: 'Cine Aurora Metropoli', idCanton: 2 }

  it('responde con el id numérico de la sede editada', async () => {
    servicio.modificarSede.mockResolvedValue(true)
    const res = crearRes()

    await editarSede({ params: { id: '4' }, body }, res)

    expect(servicio.modificarSede).toHaveBeenCalledWith('4', body)
    expect(res.json).toHaveBeenCalledWith({ idSede: 4 })
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 404 si la sede no existe o fue eliminada', async () => {
    servicio.modificarSede.mockResolvedValue(false)
    const res = crearRes()

    await editarSede({ params: { id: '4' }, body }, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sede no existe o ya fue eliminada' })
  })

  it('responde 400 con el mensaje de un ErrorValidacion', async () => {
    servicio.modificarSede.mockRejectedValue(new ErrorValidacion('El nombre es obligatorio'))
    const res = crearRes()

    await editarSede({ params: { id: '4' }, body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El nombre es obligatorio' })
  })

  it('responde 500 genérico ante un error inesperado', async () => {
    servicio.modificarSede.mockRejectedValue(new Error('detalle interno'))
    const res = crearRes()

    await editarSede({ params: { id: '4' }, body }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo editar la sede' })
    expect(console.error).toHaveBeenCalled()
  })
})

describe('eliminarSede', () => {
  it('responde con el id numérico de la sede eliminada', async () => {
    servicio.desactivarSede.mockResolvedValue(true)
    const res = crearRes()

    await eliminarSede({ params: { id: '9' } }, res)

    expect(servicio.desactivarSede).toHaveBeenCalledWith('9')
    expect(res.json).toHaveBeenCalledWith({ idSede: 9 })
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 404 si la sede no existe o ya fue eliminada', async () => {
    servicio.desactivarSede.mockResolvedValue(false)
    const res = crearRes()

    await eliminarSede({ params: { id: '9' } }, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sede no existe o ya fue eliminada' })
  })

  it('responde 400 si el id no es válido', async () => {
    servicio.desactivarSede.mockRejectedValue(new ErrorValidacion('El identificador de la sede no es válido'))
    const res = crearRes()

    await eliminarSede({ params: { id: 'abc' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El identificador de la sede no es válido' })
  })

  it('responde 500 genérico ante un error inesperado', async () => {
    servicio.desactivarSede.mockRejectedValue(new Error('detalle interno'))
    const res = crearRes()

    await eliminarSede({ params: { id: '9' } }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo eliminar la sede' })
    expect(console.error).toHaveBeenCalled()
  })
})

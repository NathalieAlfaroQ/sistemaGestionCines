import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/servicios/servicioSala.js', () => ({
  obtenerSalas: vi.fn(),
  obtenerTipos: vi.fn(),
  obtenerFormatos: vi.fn(),
  desactivarSala: vi.fn(),
}))

import * as servicio from '../../src/servicios/servicioSala.js'
import { eliminarSala, listarFormatos, listarSalas, listarTipos } from '../../src/controladores/controladorSala.js'
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

describe('listarSalas', () => {
  it('responde con la lista y pasa los filtros del query al servicio', async () => {
    servicio.obtenerSalas.mockResolvedValue([[1, 'Sala 1']])
    const res = crearRes()

    await listarSalas({ query: { busqueda: 'vip', idSede: '2', idTipo: '1', idFormato: '3', estado: 'todas' } }, res)

    expect(servicio.obtenerSalas).toHaveBeenCalledWith({
      busqueda: 'vip',
      idSede: '2',
      idTipo: '1',
      idFormato: '3',
      estado: 'todas',
    })
    expect(res.json).toHaveBeenCalledWith([[1, 'Sala 1']])
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 200 con lista vacía cuando no hay salas', async () => {
    servicio.obtenerSalas.mockResolvedValue([])
    const res = crearRes()

    await listarSalas({ query: {} }, res)

    expect(res.json).toHaveBeenCalledWith([])
  })

  it('responde 400 con el mensaje de un ErrorValidacion', async () => {
    servicio.obtenerSalas.mockRejectedValue(new ErrorValidacion('El filtro de cine no es válido'))
    const res = crearRes()

    await listarSalas({ query: { idSede: 'x' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El filtro de cine no es válido' })
  })

  it('responde 500 genérico ante un error inesperado, sin exponer el detalle', async () => {
    servicio.obtenerSalas.mockRejectedValue(new Error('ORA-03113 detalle interno'))
    const res = crearRes()

    await listarSalas({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudieron obtener las salas' })
    expect(console.error).toHaveBeenCalled()
  })
})

describe.each([
  ['listarTipos', listarTipos, () => servicio.obtenerTipos, 'No se pudieron obtener los tipos de sala'],
  ['listarFormatos', listarFormatos, () => servicio.obtenerFormatos, 'No se pudieron obtener los formatos'],
])('%s', (_nombre, controlador, obtenerMock, mensaje500) => {
  it('responde con la lista', async () => {
    obtenerMock().mockResolvedValue([[1, 'A'], [2, 'B']])
    const res = crearRes()

    await controlador({}, res)

    expect(res.json).toHaveBeenCalledWith([[1, 'A'], [2, 'B']])
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 500 genérico ante un error inesperado', async () => {
    obtenerMock().mockRejectedValue(new Error('detalle interno'))
    const res = crearRes()

    await controlador({}, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: mensaje500 })
    expect(console.error).toHaveBeenCalled()
  })
})

describe('eliminarSala', () => {
  it('responde con el id numérico de la sala eliminada', async () => {
    servicio.desactivarSala.mockResolvedValue(true)
    const res = crearRes()

    await eliminarSala({ params: { id: '9' } }, res)

    expect(servicio.desactivarSala).toHaveBeenCalledWith('9')
    expect(res.json).toHaveBeenCalledWith({ idSala: 9 })
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 404 si la sala no existe o ya fue eliminada', async () => {
    servicio.desactivarSala.mockResolvedValue(false)
    const res = crearRes()

    await eliminarSala({ params: { id: '9' } }, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sala no existe o ya fue eliminada' })
  })

  it('responde 400 si el id no es válido', async () => {
    servicio.desactivarSala.mockRejectedValue(new ErrorValidacion('El identificador de la sala no es válido'))
    const res = crearRes()

    await eliminarSala({ params: { id: 'abc' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El identificador de la sala no es válido' })
  })

  it('responde 500 genérico ante un error inesperado', async () => {
    servicio.desactivarSala.mockRejectedValue(new Error('detalle interno'))
    const res = crearRes()

    await eliminarSala({ params: { id: '9' } }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo eliminar la sala' })
    expect(console.error).toHaveBeenCalled()
  })
})

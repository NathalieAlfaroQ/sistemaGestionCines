import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioSala.js', () => ({
  listarSalas: vi.fn(),
  listarTipos: vi.fn(),
  listarFormatos: vi.fn(),
  desactivarSala: vi.fn(),
}))

import * as repositorio from '../../src/repositorios/repositorioSala.js'
import { desactivarSala, obtenerFormatos, obtenerSalas, obtenerTipos } from '../../src/servicios/servicioSala.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

async function capturarError(funcion) {
  try {
    await funcion()
  } catch (error) {
    return error
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  repositorio.listarSalas.mockResolvedValue([])
})

describe('obtenerSalas', () => {
  it('devuelve las filas que entrega el repositorio', async () => {
    const filas = [[1, 'Sala 1', 'Regular', '2D', 'Escazú', 1, 1, 1, 1]]
    repositorio.listarSalas.mockResolvedValue(filas)

    expect(await obtenerSalas()).toEqual(filas)
  })

  it('sin filtros lista solo las salas activas', async () => {
    await obtenerSalas()

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: null, idSede: null, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each([
    ['activas', 1],
    ['eliminadas', 0],
    ['todas', null],
  ])('traduce el estado "%s" a %s', async (estado, valor) => {
    await obtenerSalas({ estado })

    expect(repositorio.listarSalas).toHaveBeenCalledWith(expect.objectContaining({ estado: valor }))
  })

  it.each(['borradas', '', null, 1])('rechaza el estado %j', async (estado) => {
    const error = await capturarError(() => obtenerSalas({ estado }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de estado no es válido')
    expect(repositorio.listarSalas).not.toHaveBeenCalled()
  })

  it('convierte el cine a número y recorta la búsqueda', async () => {
    await obtenerSalas({ busqueda: '  sala 1 ', idSede: '4' })

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: 'sala 1', idSede: 4, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each([undefined, null, ''])('trata %j como "sin filtro de cine"', async (valor) => {
    await obtenerSalas({ idSede: valor })

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: null, idSede: null, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each(['', '   ', undefined, null, 5])('trata la búsqueda %j como vacía', async (busqueda) => {
    await obtenerSalas({ busqueda })

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: null, idSede: null, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each(['abc', '0', '-3', '1.5'])('rechaza el cine %j', async (idSede) => {
    const error = await capturarError(() => obtenerSalas({ idSede }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de cine no es válido')
    expect(repositorio.listarSalas).not.toHaveBeenCalled()
  })
})

describe('filtros de tipo y formato', () => {
  it('convierte tipo y formato a número', async () => {
    await obtenerSalas({ idTipo: '2', idFormato: '3' })

    expect(repositorio.listarSalas).toHaveBeenCalledWith(expect.objectContaining({ idTipo: 2, idFormato: 3 }))
  })

  it.each([undefined, null, ''])('trata %j como "sin filtro"', async (valor) => {
    await obtenerSalas({ idTipo: valor, idFormato: valor })

    expect(repositorio.listarSalas).toHaveBeenCalledWith(expect.objectContaining({ idTipo: null, idFormato: null }))
  })

  it.each([
    ['idTipo', 'tipo'],
    ['idFormato', 'formato'],
  ])('rechaza %s no válido', async (campo, etiqueta) => {
    for (const valor of ['abc', '0', '-3', '1.5']) {
      const error = await capturarError(() => obtenerSalas({ [campo]: valor }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe(`El filtro de ${etiqueta} no es válido`)
    }
    expect(repositorio.listarSalas).not.toHaveBeenCalled()
  })
})

describe('catálogos de sala', () => {
  it('obtenerTipos devuelve las filas del repositorio', async () => {
    repositorio.listarTipos.mockResolvedValue([[1, 'Regular'], [2, 'VIP']])

    expect(await obtenerTipos()).toEqual([[1, 'Regular'], [2, 'VIP']])
  })

  it('obtenerFormatos devuelve las filas del repositorio', async () => {
    repositorio.listarFormatos.mockResolvedValue([[1, '2D'], [2, '3D']])

    expect(await obtenerFormatos()).toEqual([[1, '2D'], [2, '3D']])
  })
})

describe('desactivarSala', () => {
  it('desactiva la sala indicada', async () => {
    repositorio.desactivarSala.mockResolvedValue(true)

    expect(await desactivarSala('9')).toBe(true)
    expect(repositorio.desactivarSala).toHaveBeenCalledWith(9)
  })

  it('devuelve false si la sala no existe o ya estaba eliminada', async () => {
    repositorio.desactivarSala.mockResolvedValue(false)

    expect(await desactivarSala(9)).toBe(false)
  })

  it.each([0, -1, 'abc', 1.2, '', null, undefined])('rechaza el id %j', async (id) => {
    const error = await capturarError(() => desactivarSala(id))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El identificador de la sala no es válido')
    expect(repositorio.desactivarSala).not.toHaveBeenCalled()
  })
})

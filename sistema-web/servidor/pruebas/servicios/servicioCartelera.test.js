import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioCartelera.js', () => ({
  existeSedeActiva: vi.fn(),
  listarCartelera: vi.fn(),
  listarSedesActivas: vi.fn(),
}))

vi.mock('../../src/servicios/almacenamientoImagenes.js', () => ({
  obtenerUrlImagen: vi.fn((clave) => (clave ? `https://bucket/${clave}` : null)),
}))

import * as repositorio from '../../src/repositorios/repositorioCartelera.js'
import { consultarCartelera, consultarSedes } from '../../src/servicios/servicioCartelera.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

async function capturarError(funcion) {
  try {
    await funcion()
  } catch (error) {
    return error
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('consultarSedes', () => {
  it('devuelve las filas que entrega el repositorio', async () => {
    repositorio.listarSedesActivas.mockResolvedValue([[1, 'Cine Alba']])

    expect(await consultarSedes()).toEqual([[1, 'Cine Alba']])
  })
})

describe('consultarCartelera', () => {
  it('devuelve las películas con las imágenes convertidas en URL', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(true)
    repositorio.listarCartelera.mockResolvedValue([
      [10, 'Dune', 166, 'PG-13', 'posters/10.jpg', 'banners/10.jpg'],
      [11, 'Intensamente 2', 96, 'G', null, null],
    ])

    expect(await consultarCartelera('2', '2026-11-02 14:00:00')).toEqual([
      [10, 'Dune', 166, 'PG-13', 'https://bucket/posters/10.jpg', 'https://bucket/banners/10.jpg'],
      [11, 'Intensamente 2', 96, 'G', null, null],
    ])
  })

  it('consulta con el id numérico y la hora recibida', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(true)
    repositorio.listarCartelera.mockResolvedValue([])

    await consultarCartelera('2', '2026-11-02 14:00:00')

    expect(repositorio.existeSedeActiva).toHaveBeenCalledWith(2)
    expect(repositorio.listarCartelera).toHaveBeenCalledWith(2, '2026-11-02 14:00:00')
  })

  it('usa la hora actual de Costa Rica si no recibe una', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(true)
    repositorio.listarCartelera.mockResolvedValue([])

    await consultarCartelera(2)

    expect(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(repositorio.listarCartelera.mock.calls[0][1])).toBe(true)
  })

  it('devuelve una lista vacía si la sede no tiene funciones próximas', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(true)
    repositorio.listarCartelera.mockResolvedValue([])

    expect(await consultarCartelera(2, '2026-11-02 14:00:00')).toEqual([])
  })

  it('lanza ErrorNoEncontrado si la sede no existe o está inactiva', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(false)

    const error = await capturarError(() => consultarCartelera(9, '2026-11-02 14:00:00'))

    expect(error).toBeInstanceOf(ErrorNoEncontrado)
    expect(error.message).toBe('La sede no existe')
    expect(repositorio.listarCartelera).not.toHaveBeenCalled()
  })

  it.each([undefined, null, '', 0, -1, 'abc', 1.5])('rechaza el id de sede %j', async (idSede) => {
    const error = await capturarError(() => consultarCartelera(idSede, '2026-11-02 14:00:00'))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El id de sede no es válido')
    expect(repositorio.existeSedeActiva).not.toHaveBeenCalled()
  })
})

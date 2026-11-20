import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioHistorialCompras.js', () => ({ listarHistorialCompras: vi.fn() }))
vi.mock('../../src/servicios/almacenamientoImagenes.js', () => ({
  obtenerUrlImagen: vi.fn((clave) => (clave ? `https://bucket/${clave}` : null)),
}))

import * as repositorio from '../../src/repositorios/repositorioHistorialCompras.js'
import { consultarHistorialCompras } from '../../src/servicios/servicioHistorialCompras.js'
import { ErrorNoAutenticado } from '../../src/errores/ErrorNoAutenticado.js'

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

describe('consultarHistorialCompras', () => {
  it('consulta las compras del cliente de la sesión', async () => {
    repositorio.listarHistorialCompras.mockResolvedValue([])

    await consultarHistorialCompras({ idCliente: 3 })

    expect(repositorio.listarHistorialCompras).toHaveBeenCalledWith(3)
  })

  it('convierte la clave del póster en URL y deja el resto igual', async () => {
    repositorio.listarHistorialCompras.mockResolvedValue([
      [8, 'La Odisea', 'posters/odisea.jpg', '2026-07-17 21:00', '2026-07-10 15:30'],
    ])

    expect(await consultarHistorialCompras({ idCliente: 3 })).toEqual([
      [8, 'La Odisea', 'https://bucket/posters/odisea.jpg', '2026-07-17 21:00', '2026-07-10 15:30'],
    ])
  })

  it('deja el póster en null si la película no tiene imagen', async () => {
    repositorio.listarHistorialCompras.mockResolvedValue([[9, 'Joker', null, '2019-10-04 21:00', '2019-10-01 10:00']])

    const [fila] = await consultarHistorialCompras({ idCliente: 3 })

    expect(fila[2]).toBeNull()
  })

  it('devuelve una lista vacía si el cliente no tiene compras', async () => {
    repositorio.listarHistorialCompras.mockResolvedValue([])

    expect(await consultarHistorialCompras({ idCliente: 3 })).toEqual([])
  })

  it.each([[undefined], [{}], [{ idCliente: 'abc' }], [{ idCliente: 0 }], [{ idCliente: -2 }]])(
    'rechaza una sesión sin idCliente válido (%j) sin consultar la base de datos',
    async (usuario) => {
      const error = await capturarError(() => consultarHistorialCompras(usuario))

      expect(error instanceof ErrorNoAutenticado).toBe(true)
      expect(repositorio.listarHistorialCompras).not.toHaveBeenCalled()
    },
  )
})
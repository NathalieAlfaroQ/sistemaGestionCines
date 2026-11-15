import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioDescuento.js', () => ({ listarDescuentos: vi.fn() }))

import { listarDescuentos } from '../../src/repositorios/repositorioDescuento.js'
import { obtenerDescuentos } from '../../src/servicios/servicioDescuento.js'

beforeEach(() => {
  vi.resetAllMocks()
  listarDescuentos.mockResolvedValue([])
})

describe('obtenerDescuentos', () => {
  it('por defecto lista solo los descuentos activos', async () => {
    await obtenerDescuentos()

    expect(listarDescuentos).toHaveBeenCalledWith({
      busqueda: null,
      idSede: null,
      idPelicula: null,
      fechaInicio: null,
      fechaFin: null,
      estado: 1,
    })
  })

  it('devuelve lo que entrega el repositorio', async () => {
    listarDescuentos.mockResolvedValue([[1, 'Lunes de cine']])

    expect(await obtenerDescuentos()).toEqual([[1, 'Lunes de cine']])
  })

  it('recorta la búsqueda y la envía como null si queda vacía', async () => {
    await obtenerDescuentos({ busqueda: '  lunes  ' })
    await obtenerDescuentos({ busqueda: '   ' })

    expect(listarDescuentos.mock.calls[0][0].busqueda).toBe('lunes')
    expect(listarDescuentos.mock.calls[1][0].busqueda).toBeNull()
  })

  it('convierte el cine a número y acepta fechas válidas', async () => {
    await obtenerDescuentos({ idSede: '4', idPelicula: '7', fechaInicio: '2026-11-16', fechaFin: '2026-11-22', estado: 'todos' })

    expect(listarDescuentos).toHaveBeenCalledWith({
      busqueda: null,
      idSede: 4,
      idPelicula: 7,
      fechaInicio: '2026-11-16',
      fechaFin: '2026-11-22',
      estado: null,
    })
  })

  it.each([
    [{ idSede: 'abc' }, 'El filtro de cine no es válido'],
    [{ idPelicula: '0' }, 'El filtro de película no es válido'],
    [{ fechaInicio: '2026-02-30' }, 'El filtro de fecha de inicio no es válido'],
    [{ fechaFin: '16/11/2026' }, 'El filtro de fecha de fin no es válido'],
    [{ estado: 'otro' }, 'El filtro de estado no es válido'],
  ])('rechaza filtros inválidos %j', async (filtros, mensaje) => {
    await expect(obtenerDescuentos(filtros)).rejects.toThrow(mensaje)
    expect(listarDescuentos).not.toHaveBeenCalled()
  })
})
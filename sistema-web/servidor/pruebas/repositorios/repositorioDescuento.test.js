import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { listarDescuentos } from '../../src/repositorios/repositorioDescuento.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarDescuentos', () => {
  it('devuelve las filas del resultado', async () => {
    const fila = [1, 'Semana de estrenos', 15, '2026-11-16', '08:00', '2026-11-22', '22:00', 'Cine Aurora Centro', 1, 41, 'Avengers: Doomsday, Clayface']
    ejecutar.mockResolvedValue({ rows: [fila] })

    expect(await listarDescuentos()).toEqual([fila])
  })

  it('usa null en todos los filtros cuando no se indican', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarDescuentos()

    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM DESCUENTOS'), {
      busqueda: null,
      idSede: null,
      idPelicula: null,
      fechaInicio: null,
      fechaFin: null,
      estado: null,
    })
  })

  it('envía los filtros como parámetros enlazados, no dentro del SQL', async () => {
    ejecutar.mockResolvedValue({ rows: [] })
    const filtros = { busqueda: "x' OR '1'='1", idSede: 4, idPelicula: 7, fechaInicio: '2026-11-16', fechaFin: '2026-11-22', estado: 1 }

    await listarDescuentos(filtros)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(parametros).toEqual(filtros)
    expect(sql).not.toContain("1'='1")
  })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { puntajesDePeliculas } from '../../src/repositorios/repositorioRecomendacion.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('puntajesDePeliculas', () => {
  it('devuelve [idPelicula, puntaje] y manda el cliente como bind', async () => {
    ejecutar.mockResolvedValue({ rows: [[7, 0.875], [9, 0.25]] })

    expect(await puntajesDePeliculas(4)).toEqual([[7, 0.875], [9, 0.25]])

    const [sql, binds] = ejecutar.mock.calls[0]
    expect(binds).toEqual({ idCliente: 4 })
    expect(sql).toContain('f.ID_CLIENTE = :idCliente')
  })

  it('cuenta solo boletos y una compra por factura y película, sin importar cuántos boletos compró', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await puntajesDePeliculas(4)

    const [sql] = ejecutar.mock.calls[0]
    expect(sql).toContain(`df.TIPO_FACTURA = 'BOLETO'`)
    expect(sql).toContain('SELECT DISTINCT f.ID_FACTURA, p.ID_PELICULA')
  })

  it('cada compra reparte 1 punto entre los géneros de su película y el peso es su parte del total', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await puntajesDePeliculas(4)

    const [sql] = ejecutar.mock.calls[0]
    expect(sql).toContain('SUM(1 / g.TOTAL_GENEROS) AS PUNTOS')
    expect(sql).toContain('PUNTOS / SUM(PUNTOS) OVER () AS PESO')
    expect(sql).toContain('SUM(pf.PESO) AS PUNTAJE')
  })

  it('todo se acumula: no filtra por fecha ni limita las filas', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await puntajesDePeliculas(4)

    const [sql] = ejecutar.mock.calls[0]
    expect(sql).not.toContain('FECHA')
    expect(sql).not.toContain('FETCH FIRST')
  })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { listarHistorialCompras } from '../../src/repositorios/repositorioHistorialCompras.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarHistorialCompras', () => {
  it('devuelve las filas de las compras del cliente', async () => {
    const filas = [[8, 'La Odisea', 'posters/odisea.jpg', '2026-07-17 21:00', '2026-07-10 15:30']]
    ejecutar.mockResolvedValue({ rows: filas })

    expect(await listarHistorialCompras(3)).toEqual(filas)
  })

  it('filtra por el cliente, solo cuenta boletos y ordena de la más reciente a la más antigua', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarHistorialCompras(3)

    const [sql, binds] = ejecutar.mock.calls[0]
    expect(binds).toEqual({ idCliente: 3 })
    expect(sql).toMatch(/f\.ID_CLIENTE = :idCliente/)
    expect(sql).toMatch(/TIPO_FACTURA = 'BOLETO'/)
    expect(sql).toMatch(/ORDER BY f\.FECHA DESC/)
  })
})
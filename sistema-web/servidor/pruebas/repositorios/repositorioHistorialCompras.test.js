import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import {
  DIAS_MINIMOS_DEVOLUCION,
  ESTADO_COMPRA_ACTIVA,
  ESTADO_COMPRA_CANCELADA,
  listarHistorialCompras,
} from '../../src/repositorios/repositorioHistorialCompras.js'

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

  it('agrega al final el estado, si se puede cancelar y el monto (las posiciones 0 a 4 no cambian)', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarHistorialCompras(3)

    const [sql] = ejecutar.mock.calls[0]
    expect(ESTADO_COMPRA_ACTIVA).toBe('ACTIVA')
    expect(ESTADO_COMPRA_CANCELADA).toBe('CANCELADA')
    expect(sql).toContain(`THEN 'ACTIVA' ELSE 'CANCELADA' END AS ESTADO`)
    expect(sql).toMatch(/END AS PUEDE_CANCELAR,\s+f\.MONTO\s+FROM/)
  })

  it('solo se puede cancelar una compra activa con 5 días o más para la función, en hora de Costa Rica', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarHistorialCompras(3)

    const [sql] = ejecutar.mock.calls[0]
    expect(DIAS_MINIMOS_DEVOLUCION).toBe(5)
    expect(sql).toContain(
      `AND p.FECHA - CAST(SYSTIMESTAMP AT TIME ZONE 'America/Costa_Rica' AS DATE) >= 5`
    )
    expect(sql).toMatch(/CASE WHEN MIN\(df\.ESTADO_DETALLE\) = 'ACTIVO'\s+AND p\.FECHA/)
  })
})
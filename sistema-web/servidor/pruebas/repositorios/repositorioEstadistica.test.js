import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import {
  peliculasMasVistas,
  recaudacionPorPelicula,
  ventasPorPeriodo,
} from '../../src/repositorios/repositorioEstadistica.js'

beforeEach(() => {
  vi.resetAllMocks()
  ejecutar.mockResolvedValue({ rows: [] })
})

const filtros = { desde: '2026-01-01', hasta: '2027-01-01' }

describe('SCRUM-49 métricas: un boleto devuelto no es una venta', () => {
  it.each([
    ['ventasPorPeriodo', () => ventasPorPeriodo({ agrupacion: 'anio', ...filtros })],
    ['peliculasMasVistas', () => peliculasMasVistas(filtros)],
    ['recaudacionPorPelicula', () => recaudacionPorPelicula(filtros)],
  ])('%s solo cuenta boletos ACTIVOS', async (_nombre, consultar) => {
    await consultar()

    const [sql] = ejecutar.mock.calls[0]
    expect(sql).toContain(`df.TIPO_FACTURA = 'BOLETO'`)
    expect(sql).toContain(`AND df.ESTADO_DETALLE = 'ACTIVO'`)
  })
})

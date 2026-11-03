import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { existeSedeActiva, listarCartelera, listarSedesActivas } from '../../src/repositorios/repositorioCartelera.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarSedesActivas', () => {
  it('devuelve las filas de las sedes activas', async () => {
    const filas = [[1, 'Cine Alba'], [2, 'Cine Boreal']]
    ejecutar.mockResolvedValue({ rows: filas })

    expect(await listarSedesActivas()).toEqual(filas)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('ESTADO_SEDE = 1'))
  })
})

describe('existeSedeActiva', () => {
  it('es true si hay una sede activa con ese id', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })

    expect(await existeSedeActiva(3)).toBe(true)
    expect(ejecutar.mock.calls[0][1]).toEqual({ idSede: 3 })
  })

  it('es false si no hay ninguna', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await existeSedeActiva(99)).toBe(false)
  })
})

describe('listarCartelera', () => {
  it('devuelve las filas y pasa la sede y la hora actual como binds', async () => {
    const filas = [[10, 'Dune', 166, 'PG-13', 'p.jpg', 'b.jpg']]
    ejecutar.mockResolvedValue({ rows: filas })

    expect(await listarCartelera(2, '2026-11-02 14:00:00')).toEqual(filas)
    expect(ejecutar.mock.calls[0][1]).toEqual({ idSede: 2, ahora: '2026-11-02 14:00:00' })
  })

  it('solo considera proyecciones activas, futuras y de salas activas', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarCartelera(2, '2026-11-02 14:00:00')

    const sql = ejecutar.mock.calls[0][0]
    expect(sql).toContain('pe.ESTADO_PELICULA = 1')
    expect(sql).toContain('p.ESTADO_PROYECCION = 1')
    expect(sql).toContain('s.ESTADO_SALA = 1')
    expect(sql).toContain('p.FECHA > TO_DATE(:ahora')
    expect(sql).toContain('s.ID_SEDE = :idSede')
  })
})

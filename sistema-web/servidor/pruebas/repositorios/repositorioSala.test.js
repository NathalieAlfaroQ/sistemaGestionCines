import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { desactivarSala, listarFormatos, listarSalas, listarTipos } from '../../src/repositorios/repositorioSala.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarSalas', () => {
  it('devuelve las filas del resultado', async () => {
    const filas = [[1, 'Sala 1', 'Regular', '2D', 'Escazú', 1, 1, 1, 1]]
    ejecutar.mockResolvedValue({ rows: filas })

    expect(await listarSalas()).toEqual(filas)
  })

  it('usa null en los filtros cuando no se indican', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarSalas()

    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM SALAS'), {
      busqueda: null,
      idSede: null,
      idTipo: null,
      idFormato: null,
      estado: null,
    })
  })

  it('envía los filtros como parámetros enlazados, no dentro del SQL', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarSalas({ busqueda: "x' OR '1'='1", idSede: 3, idTipo: 2, idFormato: 4, estado: 0 })

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(parametros).toEqual({ busqueda: "x' OR '1'='1", idSede: 3, idTipo: 2, idFormato: 4, estado: 0 })
    expect(sql).not.toContain("1'='1")
  })

  it('filtra por estado con un parámetro (null = todas)', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarSalas()

    const sql = ejecutar.mock.calls[0][0]
    expect(sql).toContain(':estado IS NULL OR sa.ESTADO_SALA = :estado')
    expect(sql).not.toContain('ESTADO_SALA = 1')
  })

  it('incluye ESTADO_SALA entre las columnas devueltas', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarSalas()

    expect(ejecutar.mock.calls[0][0]).toContain('sa.ESTADO_SALA,')
  })

  it('propaga el error de la base de datos', async () => {
    ejecutar.mockRejectedValue(new Error('sin conexión'))

    await expect(listarSalas()).rejects.toThrow('sin conexión')
  })
})

describe('catálogos', () => {
  it('listarTipos consulta TIPOS_SALA y devuelve las filas', async () => {
    ejecutar.mockResolvedValue({ rows: [[1, 'Regular'], [2, 'VIP']] })

    expect(await listarTipos()).toEqual([[1, 'Regular'], [2, 'VIP']])
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM TIPOS_SALA'))
  })

  it('listarFormatos consulta FORMATOS y devuelve las filas', async () => {
    ejecutar.mockResolvedValue({ rows: [[1, '2D']] })

    expect(await listarFormatos()).toEqual([[1, '2D']])
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM FORMATOS'))
  })
})

describe('desactivarSala', () => {
  it('es una eliminación lógica: hace UPDATE a ESTADO_SALA = 0, no DELETE', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 1 })

    const resultado = await desactivarSala(9)

    expect(resultado).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE SALAS SET ESTADO_SALA = 0')
    expect(sql).not.toContain('DELETE')
    expect(parametros).toEqual({ idSala: 9 })
  })

  it('solo afecta salas activas', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    await desactivarSala(9)

    expect(ejecutar.mock.calls[0][0]).toContain('ESTADO_SALA = 1')
  })

  it('devuelve false si la sala no existía o ya estaba eliminada', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    expect(await desactivarSala(9)).toBe(false)
  })
})

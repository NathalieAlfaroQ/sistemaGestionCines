import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))
vi.mock('oracledb', () => ({ default: { NUMBER: 'NUMBER', BIND_OUT: 'BIND_OUT' } }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import {
  actualizarSede,
  crearSede,
  desactivarSede,
  existeCanton,
  listarSedes,
} from '../../src/repositorios/repositorioSede.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarSedes', () => {
  it('devuelve las filas del resultado', async () => {
    ejecutar.mockResolvedValue({ rows: [[1, 'Cine A', 'Central', 'San José', 1, 3, 1]] })

    const filas = await listarSedes()

    expect(filas).toEqual([[1, 'Cine A', 'Central', 'San José', 1, 3, 1]])
  })

  it('usa null en todos los filtros cuando no se indican', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarSedes()

    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM SEDES'), {
      busqueda: null,
      nombre: null,
      idProvincia: null,
      idCanton: null,
      estado: null,
    })
  })

  it('envía los filtros como parámetros enlazados, no dentro del SQL', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarSedes({ busqueda: "x' OR '1'='1", nombre: 'Aurora', idProvincia: 2, idCanton: 5, estado: 0 })

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(parametros).toEqual({ busqueda: "x' OR '1'='1", nombre: 'Aurora', idProvincia: 2, idCanton: 5, estado: 0 })
    expect(sql).not.toContain("1'='1")
  })

  it('propaga el error de la base de datos', async () => {
    ejecutar.mockRejectedValue(new Error('sin conexión'))

    await expect(listarSedes()).rejects.toThrow('sin conexión')
  })
})

describe('crearSede', () => {
  it('inserta la sede como activa y devuelve el id generado', async () => {
    ejecutar.mockResolvedValue({ outBinds: { idSede: [42] } })

    const id = await crearSede({ nombre: 'Cine Aurora', idCanton: 3 })

    expect(id).toBe(42)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('INSERT INTO SEDES')
    expect(sql).toContain('1)')
    expect(parametros).toEqual({
      nombre: 'Cine Aurora',
      idCanton: 3,
      idSede: { type: 'NUMBER', dir: 'BIND_OUT' },
    })
  })
})

describe('actualizarSede', () => {
  it('devuelve true cuando se modificó una fila', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 1 })

    const resultado = await actualizarSede({ idSede: 4, nombre: 'Cine Aurora', idCanton: 3 })

    expect(resultado).toBe(true)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('UPDATE SEDES'), {
      nombre: 'Cine Aurora',
      idCanton: 3,
      idSede: 4,
    })
  })

  it('devuelve false cuando ninguna fila coincide', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    expect(await actualizarSede({ idSede: 4, nombre: 'Cine Aurora', idCanton: 3 })).toBe(false)
  })

  it('solo actualiza sedes activas', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    await actualizarSede({ idSede: 4, nombre: 'Cine Aurora', idCanton: 3 })

    expect(ejecutar.mock.calls[0][0]).toContain('ESTADO_SEDE = 1')
  })
})

describe('existeCanton', () => {
  it('devuelve true si la consulta trae filas', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })

    expect(await existeCanton(3)).toBe(true)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM CANTONES'), { idCanton: 3 })
  })

  it('devuelve false si no hay filas', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await existeCanton(999)).toBe(false)
  })
})

describe('desactivarSede', () => {
  it('es una eliminación lógica: hace UPDATE a ESTADO_SEDE = 0, no DELETE', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 1 })

    const resultado = await desactivarSede(9)

    expect(resultado).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE SEDES SET ESTADO_SEDE = 0')
    expect(sql).not.toContain('DELETE')
    expect(parametros).toEqual({ idSede: 9 })
  })

  it('devuelve false si la sede no existía o ya estaba eliminada', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    expect(await desactivarSede(9)).toBe(false)
  })
})

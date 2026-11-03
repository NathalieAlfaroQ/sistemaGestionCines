import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn(), ejecutarTransaccion: vi.fn() }))
vi.mock('oracledb', () => ({ default: { NUMBER: 'NUMBER', STRING: 'STRING', BIND_OUT: 'BIND_OUT' } }))

import { ejecutar, ejecutarTransaccion } from '../../src/configuracion/baseDatos.js'
import {
  crearSalaConAsientos,
  desactivarSala,
  actualizarSala,
  existeNombreSala,
  existeSedeActiva,
  listarDistribuciones,
  listarFormatos,
  listarSalas,
  listarTipos,
  obtenerDistribucion,
  obtenerPrecioFormato,
  obtenerPrecioTipo,
  obtenerSala,
} from '../../src/repositorios/repositorioSala.js'

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
    ejecutar.mockResolvedValue({ rows: [[1, 'Regular', 1000], [2, 'VIP', 2500]] })

    expect(await listarTipos()).toEqual([[1, 'Regular', 1000], [2, 'VIP', 2500]])
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM TIPOS_SALA'))
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('PRECIO'))
  })

  it('listarFormatos consulta FORMATOS y devuelve las filas', async () => {
    ejecutar.mockResolvedValue({ rows: [[1, '2D', 500]] })

    expect(await listarFormatos()).toEqual([[1, '2D', 500]])
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM FORMATOS'))
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('PRECIO'))
  })

  it('listarDistribuciones consulta DISTRIBUCIONES_SALA ordenadas por total de asientos', async () => {
    ejecutar.mockResolvedValue({ rows: [[1, '8x10', 8, 10, 80]] })

    expect(await listarDistribuciones()).toEqual([[1, '8x10', 8, 10, 80]])
    const [sql] = ejecutar.mock.calls[0]
    expect(sql).toContain('FROM DISTRIBUCIONES_SALA')
    expect(sql).toContain('ORDER BY TOTAL_ASIENTOS')
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

describe('consultas para crear una sala', () => {
  it('obtenerPrecioTipo devuelve el precio del tipo', async () => {
    ejecutar.mockResolvedValue({ rows: [[2500]] })

    expect(await obtenerPrecioTipo(2)).toBe(2500)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM TIPOS_SALA'), { idTipo: 2 })
  })

  it('obtenerPrecioTipo devuelve null si el tipo no existe', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await obtenerPrecioTipo(99)).toBe(null)
  })

  it('obtenerPrecioFormato devuelve el precio del formato, o null si no existe', async () => {
    ejecutar.mockResolvedValue({ rows: [[500]] })
    expect(await obtenerPrecioFormato(1)).toBe(500)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM FORMATOS'), { idFormato: 1 })

    ejecutar.mockResolvedValue({ rows: [] })
    expect(await obtenerPrecioFormato(99)).toBe(null)
  })

  it('obtenerDistribucion devuelve [filas, columnas], o null si no existe', async () => {
    ejecutar.mockResolvedValue({ rows: [[8, 10]] })
    expect(await obtenerDistribucion(1)).toEqual([8, 10])
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM DISTRIBUCIONES_SALA'), { idDistribucion: 1 })

    ejecutar.mockResolvedValue({ rows: [] })
    expect(await obtenerDistribucion(99)).toBe(null)
  })

  it('existeSedeActiva solo considera sedes activas', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })
    expect(await existeSedeActiva(3)).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('ESTADO_SEDE = 1')
    expect(parametros).toEqual({ idSede: 3 })

    ejecutar.mockResolvedValue({ rows: [] })
    expect(await existeSedeActiva(3)).toBe(false)
  })

  it('existeNombreSala compara sin distinguir mayúsculas, solo en salas activas del mismo cine', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })

    expect(await existeNombreSala({ idSede: 3, nombre: 'Sala 1' })).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('ESTADO_SALA = 1')
    expect(sql).toContain('UPPER(NOMBRE_SALA) = UPPER(:nombre)')
    expect(parametros).toEqual({ idSede: 3, nombre: 'Sala 1', idSalaExcluida: null })

    ejecutar.mockResolvedValue({ rows: [] })
    expect(await existeNombreSala({ idSede: 3, nombre: 'Sala 2' })).toBe(false)
  })
})

describe('existeNombreSala al editar', () => {
  it('no cuenta la propia sala: envía su id para excluirla', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await existeNombreSala({ idSede: 3, nombre: 'Sala 1', idSalaExcluida: 7 })).toBe(false)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('ID_SALA <> :idSalaExcluida')
    expect(parametros).toEqual({ idSede: 3, nombre: 'Sala 1', idSalaExcluida: 7 })
  })
})

describe('actualizarSala', () => {
  const datos = { idSala: 7, nombre: 'Sala Nueva', idTipo: 2, idFormato: 1, monto: 3000 }

  it('actualiza solo nombre, tipo, formato y monto de una sala activa', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 1 })

    expect(await actualizarSala(datos)).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE SALAS')
    expect(sql).toContain('ESTADO_SALA = 1')
    expect(sql).not.toContain('ID_SEDE')
    expect(sql).not.toContain('ID_DISTRIBUCION')
    expect(parametros).toEqual(datos)
  })

  it('devuelve false si la sala no existe o está eliminada', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    expect(await actualizarSala(datos)).toBe(false)
  })
})

describe('crearSalaConAsientos', () => {
  const datos = {
    idSede: 3,
    idTipo: 2,
    idFormato: 1,
    idDistribucion: 4,
    nombre: 'Sala 1',
    monto: 3000,
    asientos: [
      { fila: 'A', numero: 1 },
      { fila: 'A', numero: 2 },
    ],
  }
  let conexion

  beforeEach(() => {
    conexion = { execute: vi.fn(), executeMany: vi.fn() }
    conexion.execute.mockResolvedValue({ outBinds: { idSala: [55] } })
    conexion.executeMany.mockResolvedValue({})
    ejecutarTransaccion.mockImplementation(async (operaciones) => await operaciones(conexion))
  })

  it('crea la sala como activa y devuelve el id generado', async () => {
    expect(await crearSalaConAsientos(datos)).toBe(55)

    const [sql, parametros] = conexion.execute.mock.calls[0]
    expect(sql).toContain('INSERT INTO SALAS')
    expect(sql).toContain('ID_DISTRIBUCION')
    expect(sql).toContain('1)')
    expect(parametros).toEqual({
      idSede: 3,
      idTipo: 2,
      nombre: 'Sala 1',
      monto: 3000,
      idFormato: 1,
      idDistribucion: 4,
      idSala: { type: 'NUMBER', dir: 'BIND_OUT' },
    })
  })

  it('inserta todos los asientos de la sala con el id recién generado, en un solo lote', async () => {
    await crearSalaConAsientos(datos)

    expect(conexion.executeMany).toHaveBeenCalledTimes(1)
    const [sql, filas, opciones] = conexion.executeMany.mock.calls[0]
    expect(sql).toContain('INSERT INTO ASIENTOS')
    expect(filas).toEqual([
      { idSala: 55, fila: 'A', numero: 1 },
      { idSala: 55, fila: 'A', numero: 2 },
    ])
    expect(opciones.bindDefs.fila).toEqual({ type: 'STRING', maxSize: 20 })
  })

  it('todo ocurre dentro de la misma transacción', async () => {
    await crearSalaConAsientos(datos)

    expect(ejecutarTransaccion).toHaveBeenCalledTimes(1)
    expect(ejecutar).not.toHaveBeenCalled()
  })

  it('propaga el error si falla la inserción de asientos, para que se revierta todo', async () => {
    conexion.executeMany.mockRejectedValue(new Error('ORA-00001'))

    await expect(crearSalaConAsientos(datos)).rejects.toThrow('ORA-00001')
  })
})

describe('obtenerSala', () => {
  it('devuelve la fila de la sala consultada', async () => {
    const fila = [3, 'Sala 3', 1, 'Escazú', 2, 'Regular', 1, '2D', 500, 1, '8x10', 8, 10, 80, 1]
    ejecutar.mockResolvedValue({ rows: [fila] })

    expect(await obtenerSala(3)).toEqual(fila)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('WHERE sa.ID_SALA = :idSala'), { idSala: 3 })
  })

  it('devuelve null si la sala no existe', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await obtenerSala(99)).toBe(null)
  })
})

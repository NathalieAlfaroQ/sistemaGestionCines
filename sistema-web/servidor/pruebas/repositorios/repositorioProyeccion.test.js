import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn(), ejecutarTransaccion: vi.fn() }))
vi.mock('oracledb', () => ({ default: { NUMBER: 'NUMBER', BIND_OUT: 'BIND_OUT' } }))

import { ejecutar, ejecutarTransaccion } from '../../src/configuracion/baseDatos.js'
import {
  actualizarProyeccion,
  crearProyeccion,
  desactivarProyeccion,
  existeSalaActiva,
  buscarChoqueDeHorario,
  listarProyecciones,
  listarTareas,
  obtenerDuracionPelicula,
  obtenerTareasDeProyeccion,
} from '../../src/repositorios/repositorioProyeccion.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarProyecciones', () => {
  it('devuelve las filas del resultado', async () => {
    const filas = [[1, 'Dune', '2026-11-05', '14:30', 'Sala 1', 'Cine Aurora', 1, 2, 3, 4]]
    ejecutar.mockResolvedValue({ rows: filas })

    expect(await listarProyecciones()).toEqual(filas)
  })

  it('usa null en los filtros cuando no se indican', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarProyecciones()

    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM PROYECCIONES'), {
      busqueda: null,
      idPelicula: null,
      idSala: null,
      idSede: null,
      fecha: null,
      hora: null,
      estado: null,
    })
  })

  it('envía los filtros como parámetros enlazados, no dentro del SQL', async () => {
    ejecutar.mockResolvedValue({ rows: [] })
    const filtros = {
      busqueda: "x' OR '1'='1",
      idPelicula: 2,
      idSala: 3,
      idSede: 4,
      fecha: '2026-11-05',
      hora: '14:30',
      estado: 0,
    }

    await listarProyecciones(filtros)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(parametros).toEqual(filtros)
    expect(sql).not.toContain("1'='1")
    expect(sql).not.toContain('2026-11-05')
  })

  it('filtra por estado, película, sala, cine, fecha y hora con parámetros', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarProyecciones()

    const sql = ejecutar.mock.calls[0][0]
    expect(sql).toContain(':estado IS NULL OR pr.ESTADO_PROYECCION = :estado')
    expect(sql).toContain(':idPelicula IS NULL OR pe.ID_PELICULA = :idPelicula')
    expect(sql).toContain(':idSala IS NULL OR sa.ID_SALA = :idSala')
    expect(sql).toContain(':idSede IS NULL OR se.ID_SEDE = :idSede')
    expect(sql).toContain(":fecha IS NULL OR TRUNC(pr.FECHA) = TO_DATE(:fecha, 'YYYY-MM-DD')")
    expect(sql).toContain(":hora IS NULL OR TO_CHAR(pr.FECHA, 'HH24:MI') = :hora")
  })

  it('devuelve las columnas en el orden que espera el frontend', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarProyecciones()

    const sql = ejecutar.mock.calls[0][0]
    const columnas = ['ID_PROYECCION', 'TITULO', 'FECHA', 'HORA', 'NOMBRE_SALA', 'NOMBRE_SEDE', 'ESTADO_PROYECCION', 'ID_PELICULA', 'ID_SALA', 'ID_SEDE']
    const posiciones = columnas.map((columna) => sql.indexOf(columna))
    expect(posiciones).toEqual([...posiciones].sort((a, b) => a - b))
    expect(posiciones.every((posicion) => posicion >= 0)).toBe(true)
  })

  it('propaga el error de la base de datos', async () => {
    ejecutar.mockRejectedValue(new Error('ORA-03113'))

    await expect(listarProyecciones()).rejects.toThrow('ORA-03113')
  })
})

describe('obtenerDuracionPelicula', () => {
  it('devuelve la duración de la película activa', async () => {
    ejecutar.mockResolvedValue({ rows: [[120]] })

    expect(await obtenerDuracionPelicula(5)).toBe(120)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('FROM PELICULAS')
    expect(sql).toContain('ESTADO_PELICULA = 1')
    expect(parametros).toEqual({ idPelicula: 5 })
  })

  it('devuelve null si la película no existe o está eliminada', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await obtenerDuracionPelicula(5)).toBe(null)
  })
})

describe('existeSalaActiva', () => {
  it('devuelve true si la sala existe y está activa', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })

    expect(await existeSalaActiva(3)).toBe(true)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('ESTADO_SALA = 1')
    expect(parametros).toEqual({ idSala: 3 })
  })

  it('devuelve false si no existe o está eliminada', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await existeSalaActiva(3)).toBe(false)
  })
})

describe('buscarChoqueDeHorario', () => {
  const datos = { idSala: 3, fechaHora: '2026-11-05 14:30', duracion: 120 }

  it('devuelve título, inicio y fin de la proyección con la que se traslapa', async () => {
    ejecutar.mockResolvedValue({ rows: [['Dune', '18:00', '20:45']] })

    expect(await buscarChoqueDeHorario(datos)).toEqual({ titulo: 'Dune', inicio: '18:00', fin: '20:45' })
  })

  it('devuelve null si la sala está libre', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await buscarChoqueDeHorario(datos)).toBeNull()
  })

  it('compara solo con proyecciones activas de la misma sala, con parámetros enlazados', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await buscarChoqueDeHorario(datos)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('pr.ID_SALA = :idSala')
    expect(sql).toContain('pr.ESTADO_PROYECCION = 1')
    expect(parametros).toEqual({ ...datos, idExcluida: null })
    expect(sql).not.toContain('2026-11-05')
  })

  it('cuenta los minutos de las tareas adicionales de las proyecciones existentes', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await buscarChoqueDeHorario(datos)

    const [sql] = ejecutar.mock.calls[0]
    expect(sql).toContain('pe.DURACION')
    expect(sql).toContain('SUM(tp.MINUTOS_RESERVADOS)')
    expect(sql).toContain('FROM TAREAS_PROYECCION tp')
  })
})

describe('crearProyeccion', () => {
  const datos = { idSala: 3, idPelicula: 5, fechaHora: '2026-11-05 14:30' }
  let conexion

  beforeEach(() => {
    conexion = { execute: vi.fn(), executeMany: vi.fn() }
    conexion.execute.mockResolvedValue({ outBinds: { idProyeccion: [77] } })
    conexion.executeMany.mockResolvedValue({})
    ejecutarTransaccion.mockImplementation(async (operaciones) => await operaciones(conexion))
  })

  it('inserta la proyección como activa y devuelve el id generado', async () => {
    const id = await crearProyeccion(datos)

    expect(id).toBe(77)
    const [sql, parametros] = conexion.execute.mock.calls[0]
    expect(sql).toContain('INSERT INTO PROYECCIONES')
    expect(sql).toContain('1)')
    expect(sql).not.toContain('2026-11-05')
    expect(parametros).toEqual({
      idSala: 3,
      idPelicula: 5,
      fechaHora: '2026-11-05 14:30',
      idProyeccion: { type: 'NUMBER', dir: 'BIND_OUT' },
    })
  })

  it('sin tareas no inserta nada en TAREAS_PROYECCION', async () => {
    await crearProyeccion(datos)

    expect(conexion.executeMany).toHaveBeenCalledTimes(0)
  })

  it('inserta las tareas con el id recién generado, en un solo lote', async () => {
    await crearProyeccion({ ...datos, tareas: [{ idTarea: 1, minutos: 10 }, { idTarea: 2, minutos: 15 }] })

    expect(conexion.executeMany).toHaveBeenCalledTimes(1)
    const [sql, filas, opciones] = conexion.executeMany.mock.calls[0]
    expect(sql).toContain('INSERT INTO TAREAS_PROYECCION')
    expect(filas).toEqual([
      { idProyeccion: 77, idTarea: 1, minutos: 10 },
      { idProyeccion: 77, idTarea: 2, minutos: 15 },
    ])
    expect(opciones.bindDefs.minutos).toEqual({ type: 'NUMBER' })
  })

  it('todo ocurre dentro de la misma transacción', async () => {
    await crearProyeccion({ ...datos, tareas: [{ idTarea: 1, minutos: 10 }] })

    expect(ejecutarTransaccion).toHaveBeenCalledTimes(1)
    expect(ejecutar).not.toHaveBeenCalled()
  })

  it('propaga el error de la base de datos', async () => {
    conexion.execute.mockRejectedValue(new Error('ORA-02291'))

    await expect(crearProyeccion(datos)).rejects.toThrow('ORA-02291')
  })

  it('propaga el error si fallan las tareas, para que se revierta todo', async () => {
    conexion.executeMany.mockRejectedValue(new Error('ORA-00001'))

    await expect(crearProyeccion({ ...datos, tareas: [{ idTarea: 1, minutos: 10 }] })).rejects.toThrow('ORA-00001')
  })
})

describe('tareas adicionales', () => {
  it('listarTareas devuelve las tareas ordenadas por nombre', async () => {
    const filas = [[2, 'Limpieza'], [1, 'Publicidad']]
    ejecutar.mockResolvedValue({ rows: filas })

    expect(await listarTareas()).toEqual(filas)
    expect(ejecutar.mock.calls[0][0]).toContain('FROM TAREAS')
  })

  it('obtenerTareasDeProyeccion devuelve [idTarea, minutos] de esa proyección', async () => {
    ejecutar.mockResolvedValue({ rows: [[1, 10], [2, 15]] })

    expect(await obtenerTareasDeProyeccion(9)).toEqual([[1, 10], [2, 15]])
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('FROM TAREAS_PROYECCION')
    expect(parametros).toEqual({ idProyeccion: 9 })
  })
})

describe('desactivarProyeccion', () => {
  it('es una eliminación lógica: hace UPDATE a ESTADO_PROYECCION = 0, no DELETE', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 1 })

    const resultado = await desactivarProyeccion(9)

    expect(resultado).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE PROYECCIONES SET ESTADO_PROYECCION = 0')
    expect(sql).not.toContain('DELETE')
    expect(parametros).toEqual({ idProyeccion: 9 })
  })

  it('devuelve false si la proyección no existía o ya estaba eliminada', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    expect(await desactivarProyeccion(9)).toBe(false)
  })
})

describe('buscarChoqueDeHorario al editar', () => {
  it('excluye la propia proyección de la comparación', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await buscarChoqueDeHorario({ idSala: 3, fechaHora: '2026-11-05 14:30', duracion: 120, idExcluida: 9 })

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('pr.ID_PROYECCION <> :idExcluida')
    expect(parametros.idExcluida).toBe(9)
  })
})

describe('actualizarProyeccion', () => {
  const datos = { idProyeccion: 9, idSala: 3, idPelicula: 5, fechaHora: '2026-11-05 14:30' }
  let conexion

  beforeEach(() => {
    conexion = { execute: vi.fn(), executeMany: vi.fn() }
    conexion.execute.mockResolvedValue({ rowsAffected: 1 })
    conexion.executeMany.mockResolvedValue({})
    ejecutarTransaccion.mockImplementation(async (operaciones) => await operaciones(conexion))
  })

  it('actualiza solo una proyección activa, con parámetros enlazados', async () => {
    const resultado = await actualizarProyeccion(datos)

    expect(resultado).toBe(true)
    const [sql, parametros] = conexion.execute.mock.calls[0]
    expect(sql).toContain('UPDATE PROYECCIONES')
    expect(sql).toContain('ESTADO_PROYECCION = 1')
    expect(sql).not.toContain('2026-11-05')
    expect(parametros).toEqual({ idProyeccion: 9, idSala: 3, idPelicula: 5, fechaHora: '2026-11-05 14:30' })
  })

  it('reemplaza las tareas: borra las anteriores e inserta las nuevas', async () => {
    await actualizarProyeccion({ ...datos, tareas: [{ idTarea: 1, minutos: 10 }] })

    const [sqlBorrar, parametrosBorrar] = conexion.execute.mock.calls[1]
    expect(sqlBorrar).toContain('DELETE FROM TAREAS_PROYECCION')
    expect(parametrosBorrar).toEqual({ idProyeccion: 9 })
    const [sqlInsertar, filas] = conexion.executeMany.mock.calls[0]
    expect(sqlInsertar).toContain('INSERT INTO TAREAS_PROYECCION')
    expect(filas).toEqual([{ idProyeccion: 9, idTarea: 1, minutos: 10 }])
  })

  it('sin tareas deja a la proyección sin tareas (borra las anteriores y no inserta nada)', async () => {
    await actualizarProyeccion(datos)

    expect(conexion.execute.mock.calls[1][0]).toContain('DELETE FROM TAREAS_PROYECCION')
    expect(conexion.executeMany).toHaveBeenCalledTimes(0)
  })

  it('devuelve false, sin tocar las tareas, si la proyección no existía o estaba eliminada', async () => {
    conexion.execute.mockResolvedValue({ rowsAffected: 0 })

    expect(await actualizarProyeccion(datos)).toBe(false)
    expect(conexion.execute).toHaveBeenCalledTimes(1)
    expect(conexion.executeMany).toHaveBeenCalledTimes(0)
  })

  it('todo ocurre dentro de la misma transacción', async () => {
    await actualizarProyeccion(datos)

    expect(ejecutarTransaccion).toHaveBeenCalledTimes(1)
    expect(ejecutar).not.toHaveBeenCalled()
  })
})

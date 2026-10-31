import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))
vi.mock('oracledb', () => ({ default: { NUMBER: 'NUMBER', BIND_OUT: 'BIND_OUT' } }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import {
  crearProyeccion,
  existeSalaActiva,
  hayChoqueDeHorario,
  listarProyecciones,
  obtenerDuracionPelicula,
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

describe('hayChoqueDeHorario', () => {
  const datos = { idSala: 3, fechaHora: '2026-11-05 14:30', duracion: 120 }

  it('devuelve true si hay una proyección activa que se traslapa', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })

    expect(await hayChoqueDeHorario(datos)).toBe(true)
  })

  it('devuelve false si la sala está libre', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await hayChoqueDeHorario(datos)).toBe(false)
  })

  it('compara solo con proyecciones activas de la misma sala, con parámetros enlazados', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await hayChoqueDeHorario(datos)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('pr.ID_SALA = :idSala')
    expect(sql).toContain('pr.ESTADO_PROYECCION = 1')
    expect(parametros).toEqual(datos)
    expect(sql).not.toContain('2026-11-05')
  })
})

describe('crearProyeccion', () => {
  it('inserta la proyección como activa y devuelve el id generado', async () => {
    ejecutar.mockResolvedValue({ outBinds: { idProyeccion: [77] } })

    const id = await crearProyeccion({ idSala: 3, idPelicula: 5, fechaHora: '2026-11-05 14:30' })

    expect(id).toBe(77)
    const [sql, parametros] = ejecutar.mock.calls[0]
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

  it('propaga el error de la base de datos', async () => {
    ejecutar.mockRejectedValue(new Error('ORA-02291'))

    await expect(crearProyeccion({ idSala: 3, idPelicula: 5, fechaHora: '2026-11-05 14:30' })).rejects.toThrow('ORA-02291')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { listarProyecciones } from '../../src/repositorios/repositorioProyeccion.js'

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

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('oracledb', () => ({ default: { NUMBER: 'NUMBER', BIND_OUT: 'BIND_OUT' } }))
vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn(), ejecutarTransaccion: vi.fn() }))

import { ejecutar, ejecutarTransaccion } from '../../src/configuracion/baseDatos.js'
import {
  buscarChoqueDeDescuento,
  buscarOfertaDeProyeccion,
  contarPeliculasActivas,
  crearDescuento,
  desactivarDescuento,
  existeSedeActiva,
  listarDescuentos,
} from '../../src/repositorios/repositorioDescuento.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarDescuentos', () => {
  it('devuelve las filas del resultado', async () => {
    const fila = [1, 'Semana de estrenos', 15, '2026-11-16', '08:00', '2026-11-22', '22:00', 'Cine Aurora Centro', 1, 41, 'Avengers: Doomsday, Clayface']
    ejecutar.mockResolvedValue({ rows: [fila] })

    expect(await listarDescuentos()).toEqual([fila])
  })

  it('usa null en todos los filtros cuando no se indican', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarDescuentos()

    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('FROM DESCUENTOS'), {
      ahora: undefined,
      busqueda: null,
      idSede: null,
      idPelicula: null,
      fechaInicio: null,
      fechaFin: null,
      estado: null,
    })
  })

  it('envía los filtros como parámetros enlazados, no dentro del SQL', async () => {
    ejecutar.mockResolvedValue({ rows: [] })
    const filtros = { ahora: '2026-11-16 08:00', busqueda: "x' OR '1'='1", idSede: 4, idPelicula: 7, fechaInicio: '2026-11-16', fechaFin: '2026-11-22', estado: 1 }

    await listarDescuentos(filtros)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(parametros).toEqual(filtros)
    expect(sql).not.toContain("1'='1")
  })
})

describe('listarDescuentos y descuentos vencidos', () => {
  it('trata como eliminado el descuento activo cuyo periodo ya terminó', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await listarDescuentos({ estado: 1, ahora: '2026-11-16 08:00' })

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('d.FECHA_FIN > TO_DATE(:ahora')
    expect(parametros.ahora).toBe('2026-11-16 08:00')
  })
})

describe('existeSedeActiva', () => {
  it('es verdadero cuando el cine activo existe', async () => {
    ejecutar.mockResolvedValue({ rows: [[1]] })

    expect(await existeSedeActiva(4)).toBe(true)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('ESTADO_SEDE = 1'), { idSede: 4 })
  })

  it('es falso cuando no existe o está eliminado', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await existeSedeActiva(99)).toBe(false)
  })
})

describe('contarPeliculasActivas', () => {
  it('cuenta las películas activas con un bind por cada id', async () => {
    ejecutar.mockResolvedValue({ rows: [[2]] })

    expect(await contarPeliculasActivas([7, 9])).toBe(2)
    expect(ejecutar).toHaveBeenCalledWith(expect.stringContaining('IN (:p0, :p1)'), { p0: 7, p1: 9 })
  })
})

describe('buscarChoqueDeDescuento', () => {
  const datos = { ahora: '2099-11-16 07:00', idSede: 4, idsPeliculas: [7, 9], fechaInicio: '2099-11-16 08:00', fechaFin: '2099-11-22 22:00' }

  it('devuelve null cuando ningún descuento activo se cruza', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await buscarChoqueDeDescuento(datos)).toBeNull()
  })

  it('devuelve el descuento y la película que chocan, con todo enlazado', async () => {
    ejecutar.mockResolvedValue({ rows: [['Lunes de cine', 'Clayface']] })

    expect(await buscarChoqueDeDescuento(datos)).toEqual({ nombre: 'Lunes de cine', titulo: 'Clayface' })
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('ESTADO_DESCUENTO = 1')
    expect(sql).toContain('d.FECHA_FIN > TO_DATE(:ahora')
    expect(parametros).toEqual({ ahora: '2099-11-16 07:00', idSede: 4, aplicaTodas: 0, fechaInicio: '2099-11-16 08:00', fechaFin: '2099-11-22 22:00', p0: 7, p1: 9 })
  })
})

describe('buscarChoqueDeDescuento con todas las películas', () => {
  it('no compara películas y choca con cualquier descuento del cine y periodo', async () => {
    ejecutar.mockResolvedValue({ rows: [['Lunes de cine', 'Clayface']] })

    await buscarChoqueDeDescuento({ ahora: '2099-11-16 07:00', idSede: 4, idsPeliculas: [], aplicaTodas: true, fechaInicio: '2099-11-16 08:00', fechaFin: '2099-11-22 22:00' })

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).not.toContain('IN (')
    expect(parametros).toEqual({ ahora: '2099-11-16 07:00', idSede: 4, aplicaTodas: 1, fechaInicio: '2099-11-16 08:00', fechaFin: '2099-11-22 22:00' })
  })
})

describe('crearDescuento', () => {
  it('con todas las películas guarda el descuento sin insertar películas', async () => {
    const conexion = {
      execute: vi.fn().mockResolvedValue({ outBinds: { idDescuento: [16] } }),
      executeMany: vi.fn(),
    }
    ejecutarTransaccion.mockImplementation(async (trabajo) => await trabajo(conexion))

    const id = await crearDescuento({
      idSede: 4,
      nombre: 'Día del cine',
      porcentaje: 30,
      aplicaTodas: true,
      fechaInicio: '2099-11-16 08:00',
      fechaFin: '2099-11-16 22:00',
      idsPeliculas: [],
    })

    expect(id).toBe(16)
    expect(conexion.execute).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO DESCUENTOS'), expect.objectContaining({ aplicaTodas: 1 }))
    expect(conexion.executeMany).not.toHaveBeenCalled()
  })

  it('inserta el descuento y sus películas en una transacción y devuelve el id', async () => {
    const conexion = {
      execute: vi.fn().mockResolvedValue({ outBinds: { idDescuento: [15] } }),
      executeMany: vi.fn().mockResolvedValue({}),
    }
    ejecutarTransaccion.mockImplementation(async (trabajo) => await trabajo(conexion))

    const id = await crearDescuento({
      idSede: 4,
      nombre: 'Lunes de cine',
      porcentaje: 20,
      fechaInicio: '2099-11-16 08:00',
      fechaFin: '2099-11-22 22:00',
      idsPeliculas: [7, 9],
    })

    expect(id).toBe(15)
    expect(conexion.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO DESCUENTOS'),
      expect.objectContaining({ idSede: 4, nombre: 'Lunes de cine', porcentaje: 20 }),
    )
    expect(conexion.executeMany).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO DESCUENTOS_PELICULA'),
      [{ idDescuento: 15, idPelicula: 7 }, { idDescuento: 15, idPelicula: 9 }],
      expect.anything(),
    )
  })
})

describe('desactivarDescuento', () => {
  it('devuelve true cuando se desactivó una fila y marca solo los vigentes', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 1 })

    expect(await desactivarDescuento({ idDescuento: 5, ahora: '2026-11-16 08:00' })).toBe(true)
    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(sql).toContain('ESTADO_DESCUENTO = 1')
    expect(sql).toContain('d.FECHA_FIN > TO_DATE(:ahora')
    expect(parametros).toEqual({ idDescuento: 5, ahora: '2026-11-16 08:00' })
  })

  it('devuelve false cuando no existe o ya estaba eliminado', async () => {
    ejecutar.mockResolvedValue({ rowsAffected: 0 })

    expect(await desactivarDescuento({ idDescuento: 5, ahora: '2026-11-16 08:00' })).toBe(false)
  })
})

describe('buscarOfertaDeProyeccion', () => {
  it('devuelve null cuando la función no tiene oferta', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await buscarOfertaDeProyeccion(7)).toBeNull()
  })

  it('devuelve el id y el porcentaje de la oferta', async () => {
    ejecutar.mockResolvedValue({ rows: [[9, 50]] })

    expect(await buscarOfertaDeProyeccion(7)).toEqual({ idDescuento: 9, porcentaje: 50 })
  })

  it('busca por la fecha de la función, el cine de su sala y su película o todas, con la función como bind', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    await buscarOfertaDeProyeccion(7)

    const [sql, parametros] = ejecutar.mock.calls[0]
    expect(parametros).toEqual({ idProyeccion: 7 })
    expect(sql).toContain('d.ID_SEDE = s.ID_SEDE')
    expect(sql).toContain('d.ESTADO_DESCUENTO = 1')
    expect(sql).toContain('p.FECHA >= d.FECHA_INICIO')
    expect(sql).toContain('p.FECHA < d.FECHA_FIN')
    expect(sql).toContain('d.APLICA_TODAS = 1')
    expect(sql).toContain('dp.ID_PELICULA = p.ID_PELICULA')
  })
})
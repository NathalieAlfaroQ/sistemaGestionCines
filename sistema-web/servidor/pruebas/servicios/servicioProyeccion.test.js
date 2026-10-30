import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioProyeccion.js', () => ({
  listarProyecciones: vi.fn(),
}))

import * as repositorio from '../../src/repositorios/repositorioProyeccion.js'
import { obtenerProyecciones } from '../../src/servicios/servicioProyeccion.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

async function capturarError(funcion) {
  try {
    await funcion()
  } catch (error) {
    return error
  }
}

const SIN_FILTROS = {
  busqueda: null,
  idPelicula: null,
  idSala: null,
  idSede: null,
  fecha: null,
  hora: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  repositorio.listarProyecciones.mockResolvedValue([])
})

describe('obtenerProyecciones', () => {
  it('devuelve las filas del repositorio', async () => {
    const filas = [[1, 'Dune', '2026-11-05', '14:30', 'Sala 1', 'Cine Aurora', 1, 2, 3, 4]]
    repositorio.listarProyecciones.mockResolvedValue(filas)

    expect(await obtenerProyecciones()).toEqual(filas)
  })

  it('por defecto lista solo las proyecciones activas', async () => {
    await obtenerProyecciones()

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({ ...SIN_FILTROS, estado: 1 })
  })

  it.each([
    ['activas', 1],
    ['eliminadas', 0],
    ['todas', null],
  ])('traduce el estado "%s"', async (estado, valor) => {
    await obtenerProyecciones({ estado })

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({ ...SIN_FILTROS, estado: valor })
  })

  it.each(['x', '1', 'toString', '__proto__', null])('rechaza el estado %j', async (estado) => {
    const error = await capturarError(() => obtenerProyecciones({ estado }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de estado no es válido')
    expect(repositorio.listarProyecciones).not.toHaveBeenCalled()
  })

  it('convierte los ids de los filtros a número', async () => {
    await obtenerProyecciones({ idPelicula: '2', idSala: '3', idSede: '4' })

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({
      ...SIN_FILTROS,
      idPelicula: 2,
      idSala: 3,
      idSede: 4,
      estado: 1,
    })
  })

  it.each([undefined, null, ''])('trata %j como filtro vacío', async (vacio) => {
    await obtenerProyecciones({ idPelicula: vacio, idSala: vacio, idSede: vacio, fecha: vacio, hora: vacio })

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({ ...SIN_FILTROS, estado: 1 })
  })

  it.each([
    ['idPelicula', 'película'],
    ['idSala', 'sala'],
    ['idSede', 'cine'],
  ])('rechaza un %s que no es un entero positivo', async (campo, nombre) => {
    for (const valor of ['abc', '0', '-1', '1.5']) {
      const error = await capturarError(() => obtenerProyecciones({ [campo]: valor }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe(`El filtro de ${nombre} no es válido`)
    }
    expect(repositorio.listarProyecciones).not.toHaveBeenCalled()
  })

  it('acepta una fecha AAAA-MM-DD válida', async () => {
    await obtenerProyecciones({ fecha: '2026-11-05' })

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({ ...SIN_FILTROS, fecha: '2026-11-05', estado: 1 })
  })

  it('acepta el 29 de febrero de un año bisiesto', async () => {
    await obtenerProyecciones({ fecha: '2028-02-29' })

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({ ...SIN_FILTROS, fecha: '2028-02-29', estado: 1 })
  })

  it.each(['05/11/2026', '2026-1-5', '2026-13-01', '2026-02-30', '2027-02-29', 'hoy', '2026-11-05 10:00'])(
    'rechaza la fecha %j',
    async (fecha) => {
      const error = await capturarError(() => obtenerProyecciones({ fecha }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El filtro de fecha no es válido')
      expect(repositorio.listarProyecciones).not.toHaveBeenCalled()
    },
  )

  it.each(['00:00', '09:05', '14:30', '23:59'])('acepta la hora %s', async (hora) => {
    await obtenerProyecciones({ hora })

    expect(repositorio.listarProyecciones).toHaveBeenCalledWith({ ...SIN_FILTROS, hora, estado: 1 })
  })

  it.each(['24:00', '12:60', '9:30', '14:30:00', '1430', 'tarde'])('rechaza la hora %j', async (hora) => {
    const error = await capturarError(() => obtenerProyecciones({ hora }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de hora no es válido')
    expect(repositorio.listarProyecciones).not.toHaveBeenCalled()
  })

  it('recorta la búsqueda y la envía como null si queda vacía', async () => {
    await obtenerProyecciones({ busqueda: '  dune  ' })
    await obtenerProyecciones({ busqueda: '   ' })
    await obtenerProyecciones({ busqueda: 5 })

    const llamadas = repositorio.listarProyecciones.mock.calls.map(([filtros]) => filtros.busqueda)
    expect(llamadas).toEqual(['dune', null, null])
  })

  it('propaga el error del repositorio', async () => {
    repositorio.listarProyecciones.mockRejectedValue(new Error('ORA-03113'))

    await expect(obtenerProyecciones()).rejects.toThrow('ORA-03113')
  })
})

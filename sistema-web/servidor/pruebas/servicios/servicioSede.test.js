import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioSede.js', () => ({
  actualizarSede: vi.fn(),
  crearSede: vi.fn(),
  desactivarSede: vi.fn(),
  existeCanton: vi.fn(),
  listarSedes: vi.fn(),
}))

import * as repositorio from '../../src/repositorios/repositorioSede.js'
import {
  desactivarSede,
  modificarSede,
  obtenerSedes,
  registrarSede,
} from '../../src/servicios/servicioSede.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

const NOMBRE_VALIDO = 'Cine Aurora San Pedro'

async function capturarError(funcion) {
  try {
    await funcion()
  } catch (error) {
    return error
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  repositorio.existeCanton.mockResolvedValue(true)
})

describe('registrarSede', () => {
  it('crea la sede y devuelve el id generado', async () => {
    repositorio.crearSede.mockResolvedValue(15)

    const id = await registrarSede({ nombre: NOMBRE_VALIDO, idCanton: 3 })

    expect(id).toBe(15)
    expect(repositorio.crearSede).toHaveBeenCalledWith({ nombre: NOMBRE_VALIDO, idCanton: 3 })
  })

  it('normaliza el nombre: quita espacios en los extremos y colapsa los repetidos', async () => {
    repositorio.crearSede.mockResolvedValue(1)

    await registrarSede({ nombre: '   Cine   Aurora    San Pedro  ', idCanton: 3 })

    expect(repositorio.crearSede).toHaveBeenCalledWith({ nombre: NOMBRE_VALIDO, idCanton: 3 })
  })

  it('acepta el cantón como texto numérico', async () => {
    repositorio.crearSede.mockResolvedValue(1)

    await registrarSede({ nombre: NOMBRE_VALIDO, idCanton: '7' })

    expect(repositorio.crearSede).toHaveBeenCalledWith({ nombre: NOMBRE_VALIDO, idCanton: 7 })
  })

  it('acepta tildes y la ñ en el nombre', async () => {
    repositorio.crearSede.mockResolvedValue(1)

    await registrarSede({ nombre: 'Cine Peñas Blancas Ñandú', idCanton: 3 })

    expect(repositorio.crearSede).toHaveBeenCalled()
  })

  describe('datos inválidos (CP 3, 4, 5 del plan de pruebas)', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['un arreglo', []],
      ['un texto', 'Cine Aurora'],
      ['un número', 5],
    ])('rechaza que los datos sean %s', async (_etiqueta, datos) => {
      const error = await capturarError(() => registrarSede(datos))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('Los datos de la sede no son válidos')
    })

    it.each([
      ['no es texto', { nombre: 123456789012, idCanton: 3 }],
      ['falta', { idCanton: 3 }],
      ['está vacío', { nombre: '', idCanton: 3 }],
      ['solo tiene espacios', { nombre: '     ', idCanton: 3 }],
    ])('exige el nombre cuando %s', async (_etiqueta, datos) => {
      const error = await capturarError(() => registrarSede(datos))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El nombre es obligatorio')
    })

    it.each([
      ['caracteres especiales', 'Cine Aurora !@#$%^&*()'],
      ['números', 'Cine Aurora 123456789'],
      ['guion', 'Cine Aurora-Centro'],
      ['punto', 'Cine Aurora S. Pedro'],
    ])('rechaza un nombre con %s', async (_etiqueta, nombre) => {
      const error = await capturarError(() => registrarSede({ nombre, idCanton: 3 }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El nombre solo admite letras y espacios')
    })

    it('rechaza un nombre más corto que el mínimo (10)', async () => {
      const error = await capturarError(() => registrarSede({ nombre: 'Cine Aur', idCanton: 3 }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El nombre debe tener al menos 10 caracteres')
    })

    it('acepta un nombre de exactamente 10 caracteres', async () => {
      repositorio.crearSede.mockResolvedValue(1)

      await registrarSede({ nombre: 'Cine Aurot', idCanton: 3 })

      expect(repositorio.crearSede).toHaveBeenCalled()
    })

    it('acepta un nombre de exactamente 30 caracteres', async () => {
      repositorio.crearSede.mockResolvedValue(1)
      const nombre = 'a'.repeat(30)

      await registrarSede({ nombre, idCanton: 3 })

      expect(repositorio.crearSede).toHaveBeenCalledWith({ nombre, idCanton: 3 })
    })

    it('rechaza un nombre de 31 caracteres', async () => {
      const error = await capturarError(() => registrarSede({ nombre: 'a'.repeat(31), idCanton: 3 }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El nombre no puede superar los 30 caracteres')
    })

    it.each([
      ['falta', undefined],
      ['es null', null],
      ['es cero', 0],
      ['es negativo', -2],
      ['es decimal', 2.5],
      ['no es numérico', 'abc'],
    ])('exige el cantón cuando %s', async (_etiqueta, idCanton) => {
      const error = await capturarError(() => registrarSede({ nombre: NOMBRE_VALIDO, idCanton }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El cantón es obligatorio')
    })

    it('no consulta la base de datos si la validación falla', async () => {
      await capturarError(() => registrarSede({ nombre: '', idCanton: 3 }))

      expect(repositorio.existeCanton).not.toHaveBeenCalled()
      expect(repositorio.crearSede).not.toHaveBeenCalled()
    })
  })

  it('rechaza un cantón que no existe', async () => {
    repositorio.existeCanton.mockResolvedValue(false)

    const error = await capturarError(() => registrarSede({ nombre: NOMBRE_VALIDO, idCanton: 999 }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El cantón seleccionado no existe')
    expect(repositorio.crearSede).not.toHaveBeenCalled()
  })

  describe('errores de la base de datos', () => {
    it('traduce la violación de unicidad (ORA-00001)', async () => {
      repositorio.crearSede.mockRejectedValue(Object.assign(new Error('ORA-00001'), { errorNum: 1 }))

      const error = await capturarError(() => registrarSede({ nombre: NOMBRE_VALIDO, idCanton: 3 }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('Ya existe una sede con ese nombre')
    })

    it('traduce el valor demasiado largo (ORA-12899)', async () => {
      repositorio.crearSede.mockRejectedValue(Object.assign(new Error('ORA-12899'), { errorNum: 12899 }))

      const error = await capturarError(() => registrarSede({ nombre: NOMBRE_VALIDO, idCanton: 3 }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe('El nombre no puede superar los 30 caracteres')
    })

    it('deja pasar sin cambios un error desconocido', async () => {
      const original = Object.assign(new Error('ORA-03113'), { errorNum: 3113 })
      repositorio.crearSede.mockRejectedValue(original)

      const error = await capturarError(() => registrarSede({ nombre: NOMBRE_VALIDO, idCanton: 3 }))

      expect(error).toBe(original)
      expect(error).not.toBeInstanceOf(ErrorValidacion)
    })
  })
})

describe('modificarSede', () => {
  it('actualiza la sede y devuelve true', async () => {
    repositorio.actualizarSede.mockResolvedValue(true)

    const resultado = await modificarSede('4', { nombre: 'Cine Aurora Metropoli', idCanton: 2 })

    expect(resultado).toBe(true)
    expect(repositorio.actualizarSede).toHaveBeenCalledWith({
      idSede: 4,
      nombre: 'Cine Aurora Metropoli',
      idCanton: 2,
    })
  })

  it('devuelve false cuando la sede no existe o está eliminada', async () => {
    repositorio.actualizarSede.mockResolvedValue(false)

    const resultado = await modificarSede(4, { nombre: NOMBRE_VALIDO, idCanton: 2 })

    expect(resultado).toBe(false)
  })

  it.each([
    ['cero', 0],
    ['negativo', -1],
    ['decimal', 1.5],
    ['texto', 'abc'],
    ['vacío', ''],
  ])('rechaza un id %s', async (_etiqueta, id) => {
    const error = await capturarError(() => modificarSede(id, { nombre: NOMBRE_VALIDO, idCanton: 2 }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El identificador de la sede no es válido')
    expect(repositorio.actualizarSede).not.toHaveBeenCalled()
  })

  it('aplica las mismas reglas del nombre que al crear (CP 15 a 17)', async () => {
    const vacio = await capturarError(() => modificarSede(1, { nombre: '', idCanton: 2 }))
    const numeros = await capturarError(() => modificarSede(1, { nombre: 'Cine 123456789', idCanton: 2 }))

    expect(vacio.message).toBe('El nombre es obligatorio')
    expect(numeros.message).toBe('El nombre solo admite letras y espacios')
    expect(repositorio.actualizarSede).not.toHaveBeenCalled()
  })

  it('rechaza un cantón que no existe', async () => {
    repositorio.existeCanton.mockResolvedValue(false)

    const error = await capturarError(() => modificarSede(1, { nombre: NOMBRE_VALIDO, idCanton: 999 }))

    expect(error.message).toBe('El cantón seleccionado no existe')
    expect(repositorio.actualizarSede).not.toHaveBeenCalled()
  })

  it('traduce el nombre duplicado', async () => {
    repositorio.actualizarSede.mockRejectedValue(Object.assign(new Error('ORA-00001'), { errorNum: 1 }))

    const error = await capturarError(() => modificarSede(1, { nombre: NOMBRE_VALIDO, idCanton: 2 }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('Ya existe una sede con ese nombre')
  })

  it('deja pasar un error desconocido', async () => {
    const original = new Error('conexión perdida')
    repositorio.actualizarSede.mockRejectedValue(original)

    const error = await capturarError(() => modificarSede(1, { nombre: NOMBRE_VALIDO, idCanton: 2 }))

    expect(error).toBe(original)
  })
})

describe('obtenerSedes', () => {
  it('sin filtros lista solo las sedes activas', async () => {
    repositorio.listarSedes.mockResolvedValue([[1, 'Cine A']])

    const sedes = await obtenerSedes()

    expect(sedes).toEqual([[1, 'Cine A']])
    expect(repositorio.listarSedes).toHaveBeenCalledWith({
      busqueda: null,
      nombre: null,
      idProvincia: null,
      idCanton: null,
      estado: 1,
    })
  })

  it.each([
    ['activas', 1],
    ['eliminadas', 0],
    ['todas', null],
  ])('traduce el estado "%s" a %s', async (estado, valor) => {
    repositorio.listarSedes.mockResolvedValue([])

    await obtenerSedes({ estado })

    expect(repositorio.listarSedes).toHaveBeenCalledWith(expect.objectContaining({ estado: valor }))
  })

  it('rechaza un estado desconocido', async () => {
    const error = await capturarError(() => obtenerSedes({ estado: 'borradas' }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de estado no es válido')
    expect(repositorio.listarSedes).not.toHaveBeenCalled()
  })

  it('convierte los filtros de provincia y cantón a número', async () => {
    repositorio.listarSedes.mockResolvedValue([])

    await obtenerSedes({ idProvincia: '2', idCanton: '15', nombre: 'Aurora', busqueda: 'san' })

    expect(repositorio.listarSedes).toHaveBeenCalledWith({
      busqueda: 'san',
      nombre: 'Aurora',
      idProvincia: 2,
      idCanton: 15,
      estado: 1,
    })
  })

  it.each([undefined, null, ''])('trata %j en un filtro de id como "sin filtro"', async (valor) => {
    repositorio.listarSedes.mockResolvedValue([])

    await obtenerSedes({ idProvincia: valor, idCanton: valor })

    expect(repositorio.listarSedes).toHaveBeenCalledWith(
      expect.objectContaining({ idProvincia: null, idCanton: null })
    )
  })

  it('convierte texto vacío en null para nombre y búsqueda', async () => {
    repositorio.listarSedes.mockResolvedValue([])

    await obtenerSedes({ nombre: '', busqueda: '' })

    expect(repositorio.listarSedes).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: null, busqueda: null })
    )
  })

  it.each([
    ['idProvincia', 'provincia'],
    ['idCanton', 'cantón'],
  ])('rechaza %s no válido', async (campo, etiqueta) => {
    for (const valor of ['abc', '0', '-3', '1.5']) {
      const error = await capturarError(() => obtenerSedes({ [campo]: valor }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe(`El filtro de ${etiqueta} no es válido`)
    }
    expect(repositorio.listarSedes).not.toHaveBeenCalled()
  })
})

describe('desactivarSede', () => {
  it('desactiva la sede indicada', async () => {
    repositorio.desactivarSede.mockResolvedValue(true)

    const resultado = await desactivarSede('9')

    expect(resultado).toBe(true)
    expect(repositorio.desactivarSede).toHaveBeenCalledWith(9)
  })

  it('devuelve false si la sede no existe o ya estaba eliminada', async () => {
    repositorio.desactivarSede.mockResolvedValue(false)

    expect(await desactivarSede(9)).toBe(false)
  })

  it.each([0, -1, 'abc', 1.2, ''])('rechaza el id %j', async (id) => {
    const error = await capturarError(() => desactivarSede(id))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El identificador de la sede no es válido')
    expect(repositorio.desactivarSede).not.toHaveBeenCalled()
  })
})

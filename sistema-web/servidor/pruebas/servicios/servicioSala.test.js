import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioSala.js', () => ({
  actualizarSala: vi.fn(),
  crearSalaConAsientos: vi.fn(),
  existeNombreSala: vi.fn(),
  existeSedeActiva: vi.fn(),
  listarDistribuciones: vi.fn(),
  obtenerDistribucion: vi.fn(),
  obtenerPrecioFormato: vi.fn(),
  obtenerPrecioTipo: vi.fn(),
  listarSalas: vi.fn(),
  listarTipos: vi.fn(),
  listarFormatos: vi.fn(),
  desactivarSala: vi.fn(),
  obtenerSala: vi.fn(),
}))

import * as repositorio from '../../src/repositorios/repositorioSala.js'
import {
  desactivarSala,
  modificarSala,
  generarAsientos,
  nombreFila,
  obtenerDistribuciones,
  obtenerFormatos,
  obtenerSala,
  obtenerSalas,
  obtenerTipos,
  registrarSala,
} from '../../src/servicios/servicioSala.js'
import { ErrorConflicto } from '../../src/errores/ErrorConflicto.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

async function capturarError(funcion) {
  try {
    await funcion()
  } catch (error) {
    return error
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  repositorio.listarSalas.mockResolvedValue([])
})

describe('obtenerSalas', () => {
  it('devuelve las filas que entrega el repositorio', async () => {
    const filas = [[1, 'Sala 1', 'Regular', '2D', 'Escazú', 1, 1, 1, 1]]
    repositorio.listarSalas.mockResolvedValue(filas)

    expect(await obtenerSalas()).toEqual(filas)
  })

  it('sin filtros lista solo las salas activas', async () => {
    await obtenerSalas()

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: null, idSede: null, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each([
    ['activas', 1],
    ['eliminadas', 0],
    ['todas', null],
  ])('traduce el estado "%s" a %s', async (estado, valor) => {
    await obtenerSalas({ estado })

    expect(repositorio.listarSalas).toHaveBeenCalledWith(expect.objectContaining({ estado: valor }))
  })

  it.each(['borradas', '', null, 1])('rechaza el estado %j', async (estado) => {
    const error = await capturarError(() => obtenerSalas({ estado }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de estado no es válido')
    expect(repositorio.listarSalas).not.toHaveBeenCalled()
  })

  it('convierte el cine a número y recorta la búsqueda', async () => {
    await obtenerSalas({ busqueda: '  sala 1 ', idSede: '4' })

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: 'sala 1', idSede: 4, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each([undefined, null, ''])('trata %j como "sin filtro de cine"', async (valor) => {
    await obtenerSalas({ idSede: valor })

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: null, idSede: null, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each(['', '   ', undefined, null, 5])('trata la búsqueda %j como vacía', async (busqueda) => {
    await obtenerSalas({ busqueda })

    expect(repositorio.listarSalas).toHaveBeenCalledWith({ busqueda: null, idSede: null, idTipo: null, idFormato: null, estado: 1 })
  })

  it.each(['abc', '0', '-3', '1.5'])('rechaza el cine %j', async (idSede) => {
    const error = await capturarError(() => obtenerSalas({ idSede }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El filtro de cine no es válido')
    expect(repositorio.listarSalas).not.toHaveBeenCalled()
  })
})

describe('filtros de tipo y formato', () => {
  it('convierte tipo y formato a número', async () => {
    await obtenerSalas({ idTipo: '2', idFormato: '3' })

    expect(repositorio.listarSalas).toHaveBeenCalledWith(expect.objectContaining({ idTipo: 2, idFormato: 3 }))
  })

  it.each([undefined, null, ''])('trata %j como "sin filtro"', async (valor) => {
    await obtenerSalas({ idTipo: valor, idFormato: valor })

    expect(repositorio.listarSalas).toHaveBeenCalledWith(expect.objectContaining({ idTipo: null, idFormato: null }))
  })

  it.each([
    ['idTipo', 'tipo'],
    ['idFormato', 'formato'],
  ])('rechaza %s no válido', async (campo, etiqueta) => {
    for (const valor of ['abc', '0', '-3', '1.5']) {
      const error = await capturarError(() => obtenerSalas({ [campo]: valor }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe(`El filtro de ${etiqueta} no es válido`)
    }
    expect(repositorio.listarSalas).not.toHaveBeenCalled()
  })
})

describe('catálogos de sala', () => {
  it('obtenerTipos devuelve las filas del repositorio', async () => {
    repositorio.listarTipos.mockResolvedValue([[1, 'Regular'], [2, 'VIP']])

    expect(await obtenerTipos()).toEqual([[1, 'Regular'], [2, 'VIP']])
  })

  it('obtenerFormatos devuelve las filas del repositorio', async () => {
    repositorio.listarFormatos.mockResolvedValue([[1, '2D'], [2, '3D']])

    expect(await obtenerFormatos()).toEqual([[1, '2D'], [2, '3D']])
  })
})

describe('desactivarSala', () => {
  it('desactiva la sala indicada', async () => {
    repositorio.desactivarSala.mockResolvedValue(true)

    expect(await desactivarSala('9')).toBeUndefined()
    expect(repositorio.desactivarSala).toHaveBeenCalledWith(9)
  })

  it('lanza ErrorNoEncontrado si la sala no existe o ya estaba eliminada', async () => {
    repositorio.desactivarSala.mockResolvedValue(false)

    const error = await capturarError(() => desactivarSala(9))

    expect(error).toBeInstanceOf(ErrorNoEncontrado)
    expect(error.message).toBe('La sala no existe o ya fue eliminada')
  })

  it.each([0, -1, 'abc', 1.2, '', null, undefined])('rechaza el id %j', async (id) => {
    const error = await capturarError(() => desactivarSala(id))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El identificador de la sala no es válido')
    expect(repositorio.desactivarSala).not.toHaveBeenCalled()
  })
})

describe('obtenerDistribuciones', () => {
  it('devuelve las filas que entrega el repositorio', async () => {
    repositorio.listarDistribuciones.mockResolvedValue([[1, '8x10', 8, 10, 80]])

    expect(await obtenerDistribuciones()).toEqual([[1, '8x10', 8, 10, 80]])
  })
})

describe('nombreFila', () => {
  it.each([
    [0, 'A'],
    [1, 'B'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
    [51, 'AZ'],
    [52, 'BA'],
    [701, 'ZZ'],
    [702, 'AAA'],
  ])('la fila de índice %i se llama %s', (indice, nombre) => {
    expect(nombreFila(indice)).toBe(nombre)
  })
})

describe('generarAsientos', () => {
  it('genera filas × columnas asientos, numerados desde 1 en cada fila', () => {
    expect(generarAsientos(2, 3)).toEqual([
      { fila: 'A', numero: 1 },
      { fila: 'A', numero: 2 },
      { fila: 'A', numero: 3 },
      { fila: 'B', numero: 1 },
      { fila: 'B', numero: 2 },
      { fila: 'B', numero: 3 },
    ])
  })

  it.each([
    [4, 4],
    [8, 10],
    [16, 20],
  ])('una distribución %ix%i genera exactamente su total de asientos, sin repetidos', (filas, columnas) => {
    const asientos = generarAsientos(filas, columnas)

    expect(asientos).toHaveLength(filas * columnas)
    expect(new Set(asientos.map(({ fila, numero }) => `${fila}${numero}`)).size).toBe(filas * columnas)
    expect(asientos.at(-1)).toEqual({ fila: nombreFila(filas - 1), numero: columnas })
  })
})

describe('registrarSala', () => {
  const DATOS = { nombre: 'Sala 1', idSede: 3, idTipo: 2, idFormato: 1, idDistribucion: 4 }

  beforeEach(() => {
    repositorio.existeSedeActiva.mockResolvedValue(true)
    repositorio.obtenerPrecioTipo.mockResolvedValue(2500)
    repositorio.obtenerPrecioFormato.mockResolvedValue(500)
    repositorio.obtenerDistribucion.mockResolvedValue([2, 3])
    repositorio.existeNombreSala.mockResolvedValue(false)
    repositorio.crearSalaConAsientos.mockResolvedValue(55)
  })

  it('crea la sala con el monto calculado y los asientos de la distribución, y devuelve el id', async () => {
    const id = await registrarSala(DATOS)

    expect(id).toBe(55)
    expect(repositorio.crearSalaConAsientos).toHaveBeenCalledWith({
      nombre: 'Sala 1',
      idSede: 3,
      idTipo: 2,
      idFormato: 1,
      idDistribucion: 4,
      monto: 3000,
      asientos: generarAsientos(2, 3),
    })
  })

  it('el monto no se toma de lo que mande el cliente', async () => {
    await registrarSala({ ...DATOS, monto: 1, precio: 1 })

    expect(repositorio.crearSalaConAsientos).toHaveBeenCalledWith(expect.objectContaining({ monto: 3000 }))
  })

  it('normaliza el nombre y convierte los ids que llegan como texto', async () => {
    await registrarSala({ nombre: '  Sala   VIP 2 ', idSede: '3', idTipo: '2', idFormato: '1', idDistribucion: '4' })

    expect(repositorio.existeNombreSala).toHaveBeenCalledWith({ idSede: 3, nombre: 'Sala VIP 2' })
    expect(repositorio.crearSalaConAsientos).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Sala VIP 2', idSede: 3, idTipo: 2, idFormato: 1, idDistribucion: 4 }),
    )
  })

  it.each([null, undefined, 'texto', 5, []])('rechaza los datos %j', async (datos) => {
    const error = await capturarError(() => registrarSala(datos))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('Los datos de la sala no son válidos')
    expect(repositorio.crearSalaConAsientos).not.toHaveBeenCalled()
  })

  it.each([undefined, null, '', '   ', 5])('rechaza un nombre vacío o que no es texto (%j)', async (nombre) => {
    const error = await capturarError(() => registrarSala({ ...DATOS, nombre }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El nombre es obligatorio')
  })

  it.each(['a', 'Sala', 'S 1'])('rechaza el nombre %j por tener menos de 5 caracteres', async (nombre) => {
    const error = await capturarError(() => registrarSala({ ...DATOS, nombre }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El nombre debe tener al menos 5 caracteres')
    expect(repositorio.crearSalaConAsientos).not.toHaveBeenCalled()
  })

  it('acepta un nombre de exactamente 5 caracteres', async () => {
    await registrarSala({ ...DATOS, nombre: 'Sala1' })

    expect(repositorio.crearSalaConAsientos).toHaveBeenCalled()
  })

  it('los espacios al inicio y al final no cuentan para el mínimo', async () => {
    const error = await capturarError(() => registrarSala({ ...DATOS, nombre: '  Sala  ' }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El nombre debe tener al menos 5 caracteres')
  })

  it('rechaza un nombre de más de 20 caracteres', async () => {
    const error = await capturarError(() => registrarSala({ ...DATOS, nombre: 'a'.repeat(21) }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El nombre no puede superar los 20 caracteres')
  })

  it('acepta un nombre de exactamente 20 caracteres', async () => {
    await registrarSala({ ...DATOS, nombre: 'a'.repeat(20) })

    expect(repositorio.crearSalaConAsientos).toHaveBeenCalled()
  })

  it.each(['Sala #1', 'Sala-1', 'Sala_1', "Sala'1"])('rechaza el nombre con símbolos %j', async (nombre) => {
    const error = await capturarError(() => registrarSala({ ...DATOS, nombre }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El nombre solo admite letras y números')
  })

  it.each(['Sala 1', 'Sala VIP', 'Cámara 3D', 'IMAX 3D'])('acepta el nombre %j', async (nombre) => {
    await registrarSala({ ...DATOS, nombre })

    expect(repositorio.crearSalaConAsientos).toHaveBeenCalled()
  })

  it.each([
    ['idSede', 'El cine es obligatorio'],
    ['idTipo', 'El tipo es obligatorio'],
    ['idFormato', 'El formato es obligatorio'],
    ['idDistribucion', 'La distribución es obligatoria'],
  ])('rechaza %s vacío o inválido', async (campo, mensaje) => {
    for (const valor of [undefined, null, '', 'abc', 0, -1, 1.5]) {
      const error = await capturarError(() => registrarSala({ ...DATOS, [campo]: valor }))

      expect(error).toBeInstanceOf(ErrorValidacion)
      expect(error.message).toBe(mensaje)
    }
    expect(repositorio.crearSalaConAsientos).not.toHaveBeenCalled()
  })

  it('rechaza un cine que no existe o está eliminado', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(false)

    const error = await capturarError(() => registrarSala(DATOS))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El cine seleccionado no existe')
    expect(repositorio.crearSalaConAsientos).not.toHaveBeenCalled()
  })

  it('rechaza un tipo que no existe', async () => {
    repositorio.obtenerPrecioTipo.mockResolvedValue(null)

    const error = await capturarError(() => registrarSala(DATOS))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El tipo de sala seleccionado no existe')
  })

  it('rechaza un formato que no existe', async () => {
    repositorio.obtenerPrecioFormato.mockResolvedValue(null)

    const error = await capturarError(() => registrarSala(DATOS))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El formato seleccionado no existe')
  })

  it('rechaza una distribución que no existe', async () => {
    repositorio.obtenerDistribucion.mockResolvedValue(null)

    const error = await capturarError(() => registrarSala(DATOS))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('La distribución seleccionada no existe')
  })

  it('lanza ErrorConflicto si el cine ya tiene una sala activa con ese nombre', async () => {
    repositorio.existeNombreSala.mockResolvedValue(true)

    const error = await capturarError(() => registrarSala(DATOS))

    expect(error).toBeInstanceOf(ErrorConflicto)
    expect(error.message).toBe('Ya existe una sala con ese nombre en este cine')
    expect(repositorio.crearSalaConAsientos).not.toHaveBeenCalled()
  })

  it('propaga el error del repositorio sin traducirlo', async () => {
    const original = new Error('ORA-03113')
    repositorio.crearSalaConAsientos.mockRejectedValue(original)

    expect(await capturarError(() => registrarSala(DATOS))).toBe(original)
  })
})

describe('obtenerSala', () => {
  it('devuelve la fila que entrega el repositorio', async () => {
    const fila = [3, 'Sala 3', 1, 'Escazú', 2, 'Regular', 1, '2D', 500, 1, '8x10', 8, 10, 80, 1]
    repositorio.obtenerSala.mockResolvedValue(fila)

    expect(await obtenerSala('3')).toEqual(fila)
    expect(repositorio.obtenerSala).toHaveBeenCalledWith(3)
  })

  it('lanza ErrorNoEncontrado si la sala no existe', async () => {
    repositorio.obtenerSala.mockResolvedValue(null)

    const error = await capturarError(() => obtenerSala(9))

    expect(error).toBeInstanceOf(ErrorNoEncontrado)
    expect(error.message).toBe('La sala no existe')
  })

  it.each([0, -1, 'abc', 1.2, '', null, undefined])('rechaza el id %j', async (id) => {
    const error = await capturarError(() => obtenerSala(id))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El identificador de la sala no es válido')
    expect(repositorio.obtenerSala).not.toHaveBeenCalled()
  })
})

describe('modificarSala', () => {
  // Fila que devuelve obtenerSala: el cine está en la posición 2 y el estado en la 14
  const FILA_SALA = [7, 'Sala 1', 3, 'Escazú', 1, 'Regular', 1, '2D', 1500, 4, '8x10', 8, 10, 80, 1]
  const DATOS = { nombre: 'Sala VIP 2', idTipo: 2, idFormato: 1 }

  beforeEach(() => {
    repositorio.obtenerSala.mockResolvedValue(FILA_SALA)
    repositorio.obtenerPrecioTipo.mockResolvedValue(2500)
    repositorio.obtenerPrecioFormato.mockResolvedValue(500)
    repositorio.existeNombreSala.mockResolvedValue(false)
    repositorio.actualizarSala.mockResolvedValue(true)
  })

  it('actualiza nombre, tipo y formato con el monto recalculado', async () => {
    expect(await modificarSala(7, DATOS)).toBeUndefined()

    expect(repositorio.actualizarSala).toHaveBeenCalledWith({
      idSala: 7,
      nombre: 'Sala VIP 2',
      idTipo: 2,
      idFormato: 1,
      monto: 3000,
    })
  })

  it('normaliza el nombre y acepta ids como texto', async () => {
    await modificarSala('7', { nombre: '  Sala   VIP 2 ', idTipo: '2', idFormato: '1' })

    expect(repositorio.actualizarSala).toHaveBeenCalledWith(
      expect.objectContaining({ idSala: 7, nombre: 'Sala VIP 2', idTipo: 2, idFormato: 1 }),
    )
  })

  it('ignora el cine, la distribución y el monto que mande el cliente', async () => {
    await modificarSala(7, { ...DATOS, idSede: 99, idDistribucion: 99, monto: 1 })

    expect(repositorio.actualizarSala).toHaveBeenCalledWith({
      idSala: 7,
      nombre: 'Sala VIP 2',
      idTipo: 2,
      idFormato: 1,
      monto: 3000,
    })
    expect(repositorio.existeNombreSala).toHaveBeenCalledWith({ idSede: 3, nombre: 'Sala VIP 2', idSalaExcluida: 7 })
  })

  it('valida el nombre de repetido en el cine de la sala, sin contar la propia sala', async () => {
    await modificarSala(7, DATOS)

    expect(repositorio.existeNombreSala).toHaveBeenCalledWith({ idSede: 3, nombre: 'Sala VIP 2', idSalaExcluida: 7 })
  })

  it('lanza ErrorConflicto si otra sala del cine ya tiene ese nombre', async () => {
    repositorio.existeNombreSala.mockResolvedValue(true)

    const error = await capturarError(() => modificarSala(7, DATOS))

    expect(error).toBeInstanceOf(ErrorConflicto)
    expect(error.message).toBe('Ya existe una sala con ese nombre en este cine')
    expect(repositorio.actualizarSala).not.toHaveBeenCalled()
  })

  it.each([0, -1, 'abc', 1.5, ''])('rechaza el id %j', async (id) => {
    const error = await capturarError(() => modificarSala(id, DATOS))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('El identificador de la sala no es válido')
    expect(repositorio.actualizarSala).not.toHaveBeenCalled()
  })

  it.each([null, undefined, 'texto', 5, []])('rechaza los datos %j', async (datos) => {
    const error = await capturarError(() => modificarSala(7, datos))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe('Los datos de la sala no son válidos')
  })

  it.each([
    ['vacío', '', 'El nombre es obligatorio'],
    ['con caracteres especiales', 'Sala #2', 'El nombre solo admite letras y números'],
    ['demasiado corto', 'Sala', 'El nombre debe tener al menos 5 caracteres'],
    ['demasiado largo', 'A'.repeat(21), 'El nombre no puede superar los 20 caracteres'],
  ])('rechaza un nombre %s', async (_descripcion, nombre, mensaje) => {
    const error = await capturarError(() => modificarSala(7, { ...DATOS, nombre }))

    expect(error).toBeInstanceOf(ErrorValidacion)
    expect(error.message).toBe(mensaje)
    expect(repositorio.actualizarSala).not.toHaveBeenCalled()
  })

  it('exige el tipo y el formato', async () => {
    const sinTipo = await capturarError(() => modificarSala(7, { ...DATOS, idTipo: '' }))
    const sinFormato = await capturarError(() => modificarSala(7, { ...DATOS, idFormato: undefined }))

    expect(sinTipo.message).toBe('El tipo es obligatorio')
    expect(sinFormato.message).toBe('El formato es obligatorio')
  })

  it('rechaza un tipo o un formato que no existen', async () => {
    repositorio.obtenerPrecioTipo.mockResolvedValue(null)
    const sinTipo = await capturarError(() => modificarSala(7, DATOS))

    repositorio.obtenerPrecioTipo.mockResolvedValue(2500)
    repositorio.obtenerPrecioFormato.mockResolvedValue(null)
    const sinFormato = await capturarError(() => modificarSala(7, DATOS))

    expect(sinTipo).toBeInstanceOf(ErrorValidacion)
    expect(sinTipo.message).toBe('El tipo de sala seleccionado no existe')
    expect(sinFormato).toBeInstanceOf(ErrorValidacion)
    expect(sinFormato.message).toBe('El formato seleccionado no existe')
  })

  it('lanza ErrorNoEncontrado si la sala no existe', async () => {
    repositorio.obtenerSala.mockResolvedValue(null)

    const error = await capturarError(() => modificarSala(7, DATOS))

    expect(error).toBeInstanceOf(ErrorNoEncontrado)
    expect(error.message).toBe('La sala no existe o ya fue eliminada')
    expect(repositorio.actualizarSala).not.toHaveBeenCalled()
  })

  it('lanza ErrorNoEncontrado si la sala ya está eliminada', async () => {
    repositorio.obtenerSala.mockResolvedValue([...FILA_SALA.slice(0, 14), 0])

    const error = await capturarError(() => modificarSala(7, DATOS))

    expect(error).toBeInstanceOf(ErrorNoEncontrado)
    expect(repositorio.actualizarSala).not.toHaveBeenCalled()
  })

  it('lanza ErrorNoEncontrado si la sala se eliminó justo antes de actualizar', async () => {
    repositorio.actualizarSala.mockResolvedValue(false)

    const error = await capturarError(() => modificarSala(7, DATOS))

    expect(error).toBeInstanceOf(ErrorNoEncontrado)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioDescuento.js', () => ({
  buscarChoqueDeDescuento: vi.fn(),
  contarPeliculasActivas: vi.fn(),
  crearDescuento: vi.fn(),
  desactivarDescuento: vi.fn(),
  existeSedeActiva: vi.fn(),
  listarDescuentos: vi.fn(),
}))

import * as repositorio from '../../src/repositorios/repositorioDescuento.js'
import { desactivarDescuento, obtenerDescuentos, registrarDescuento } from '../../src/servicios/servicioDescuento.js'
import { ErrorConflicto } from '../../src/errores/ErrorConflicto.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

const { listarDescuentos } = repositorio

beforeEach(() => {
  vi.resetAllMocks()
  listarDescuentos.mockResolvedValue([])
  repositorio.existeSedeActiva.mockResolvedValue(true)
  repositorio.contarPeliculasActivas.mockResolvedValue(2)
  repositorio.buscarChoqueDeDescuento.mockResolvedValue(null)
  repositorio.crearDescuento.mockResolvedValue(15)
})

describe('obtenerDescuentos', () => {
  it('por defecto lista solo los descuentos activos', async () => {
    await obtenerDescuentos()

    expect(listarDescuentos).toHaveBeenCalledWith({
      busqueda: null,
      idSede: null,
      idPelicula: null,
      fechaInicio: null,
      fechaFin: null,
      estado: 1,
    })
  })

  /* Para restaurar el vencimiento automático: quitar este comentario (y cambiar la prueba anterior a objectContaining)
  it('manda la fecha y hora actuales (AAAA-MM-DD HH:MM) para que los vencidos cuenten como eliminados', async () => {
    await obtenerDescuentos()

    expect(listarDescuentos.mock.calls[0][0].ahora).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
  */

  it('devuelve lo que entrega el repositorio', async () => {
    listarDescuentos.mockResolvedValue([[1, 'Lunes de cine']])

    expect(await obtenerDescuentos()).toEqual([[1, 'Lunes de cine']])
  })

  it('recorta la búsqueda y la manda como null cuando queda vacía', async () => {
    await obtenerDescuentos({ busqueda: '  lunes ' })
    await obtenerDescuentos({ busqueda: '   ' })

    expect(listarDescuentos.mock.calls[0][0].busqueda).toBe('lunes')
    expect(listarDescuentos.mock.calls[1][0].busqueda).toBeNull()
  })

  it('convierte los filtros de cine, película y fechas', async () => {
    await obtenerDescuentos({ idSede: '4', idPelicula: '7', fechaInicio: '2026-11-16', fechaFin: '2026-11-22', estado: 'todos' })

    expect(listarDescuentos).toHaveBeenCalledWith({
      busqueda: null,
      idSede: 4,
      idPelicula: 7,
      fechaInicio: '2026-11-16',
      fechaFin: '2026-11-22',
      estado: null,
    })
  })

  it('traduce el estado eliminados', async () => {
    await obtenerDescuentos({ estado: 'eliminados' })

    expect(listarDescuentos.mock.calls[0][0].estado).toBe(0)
  })

  it.each([
    [{ idSede: 'abc' }, 'El filtro de cine no es válido'],
    [{ idPelicula: '0' }, 'El filtro de película no es válido'],
    [{ fechaInicio: '2026-02-30' }, 'El filtro de fecha de inicio no es válido'],
    [{ fechaFin: '16/11/2026' }, 'El filtro de fecha de fin no es válido'],
  ])('rechaza el filtro %j', async (filtros, mensaje) => {
    await expect(obtenerDescuentos(filtros)).rejects.toThrow(mensaje)
    expect(listarDescuentos).not.toHaveBeenCalled()
  })
})

const VALIDO = {
  nombre: '  Lunes de cine ',
  idSede: '4',
  idsPeliculas: [7, '9'],
  porcentaje: '20',
  fechaInicio: '2099-11-16',
  horaInicio: '08:00',
  fechaFin: '2099-11-22',
  horaFin: '22:00',
}

describe('registrarDescuento', () => {
  it('crea el descuento con los datos limpios y devuelve su id', async () => {
    expect(await registrarDescuento(VALIDO)).toBe(15)

    expect(repositorio.crearDescuento).toHaveBeenCalledWith({
      nombre: 'Lunes de cine',
      idSede: 4,
      aplicaTodas: false,
      idsPeliculas: [7, 9],
      porcentaje: 20,
      fechaInicio: '2099-11-16 08:00',
      fechaFin: '2099-11-22 22:00',
    })
  })

  it.each([
    [{ nombre: '   ' }, 'El nombre es obligatorio'],
    [{ nombre: 'x'.repeat(51) }, 'El nombre no puede superar los 50 caracteres'],
    [{ idSede: '' }, 'El cine es obligatorio'],
    [{ idsPeliculas: [] }, 'Debe seleccionar al menos una película'],
    [{ idsPeliculas: undefined }, 'Debe seleccionar al menos una película'],
    [{ idsPeliculas: [7, 7] }, 'No se puede repetir una película'],
    [{ idsPeliculas: ['abc'] }, 'Las películas seleccionadas no son válidas'],
    [{ porcentaje: '' }, 'El porcentaje es obligatorio'],
    [{ porcentaje: '0' }, 'El porcentaje debe ser mayor que 0 y no mayor que 100'],
    [{ porcentaje: '101' }, 'El porcentaje debe ser mayor que 0 y no mayor que 100'],
    [{ porcentaje: 'abc' }, 'El porcentaje debe ser mayor que 0 y no mayor que 100'],
    [{ porcentaje: '12.345' }, 'El porcentaje admite máximo dos decimales'],
    [{ fechaInicio: '' }, 'La fecha de inicio es obligatoria'],
    [{ fechaInicio: '2099-02-30' }, 'La fecha de inicio no es válida'],
    [{ horaInicio: '' }, 'La hora de inicio es obligatoria'],
    [{ horaInicio: '25:00' }, 'La hora de inicio no es válida'],
    [{ fechaFin: '' }, 'La fecha de fin es obligatoria'],
    [{ horaFin: '8am' }, 'La hora de fin no es válida'],
    [{ fechaFin: '2099-11-16', horaFin: '08:00' }, 'La fecha y hora de fin debe ser posterior a la de inicio'],
    [{ fechaInicio: '2020-01-01', fechaFin: '2020-01-02' }, 'La fecha y hora de fin debe ser posterior a la fecha y hora actuales'],
  ])('rechaza %j', async (cambios, mensaje) => {
    await expect(registrarDescuento({ ...VALIDO, ...cambios })).rejects.toThrow(mensaje)
    expect(repositorio.crearDescuento).not.toHaveBeenCalled()
  })

  it('con "todas" no exige películas, no consulta el catálogo y no guarda ninguna', async () => {
    expect(await registrarDescuento({ ...VALIDO, aplicaTodas: true, idsPeliculas: [] })).toBe(15)

    expect(repositorio.contarPeliculasActivas).not.toHaveBeenCalled()
    expect(repositorio.crearDescuento).toHaveBeenCalledWith(
      expect.objectContaining({ aplicaTodas: true, idsPeliculas: [] }),
    )
  })

  it('con "todas" ignora las películas que lleguen', async () => {
    await registrarDescuento({ ...VALIDO, aplicaTodas: true })

    expect(repositorio.crearDescuento).toHaveBeenCalledWith(expect.objectContaining({ idsPeliculas: [] }))
  })

  it('rechaza un valor de "todas" que no es booleano', async () => {
    await expect(registrarDescuento({ ...VALIDO, aplicaTodas: 'si' })).rejects.toThrow(
      'La opción de todas las películas no es válida',
    )
  })

  it('con "todas" también busca choques', async () => {
    repositorio.buscarChoqueDeDescuento.mockResolvedValue({ nombre: 'Semana de estrenos', titulo: 'Clayface' })

    await expect(registrarDescuento({ ...VALIDO, aplicaTodas: true })).rejects.toThrow('ya aplica a "Clayface"')
    expect(repositorio.buscarChoqueDeDescuento).toHaveBeenCalledWith(expect.objectContaining({ aplicaTodas: true }))
  })

  it('indica "todas las películas" cuando el descuento que choca aplica a todas', async () => {
    repositorio.buscarChoqueDeDescuento.mockResolvedValue({ nombre: 'Día del cine', titulo: null })

    await expect(registrarDescuento(VALIDO)).rejects.toThrow(
      'El descuento "Día del cine" ya aplica a todas las películas en ese cine durante ese periodo',
    )
  })

  /* Para restaurar el vencimiento automático: quitar este comentario
  it('al buscar choques manda la hora actual, para que un descuento vencido no bloquee', async () => {
    await registrarDescuento(VALIDO)

    expect(repositorio.buscarChoqueDeDescuento.mock.calls[0][0].ahora).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
  */

  it('rechaza datos que no son un objeto', async () => {
    await expect(registrarDescuento(null)).rejects.toThrow('Los datos del descuento no son válidos')
  })

  it('rechaza un cine que no existe o está eliminado', async () => {
    repositorio.existeSedeActiva.mockResolvedValue(false)

    await expect(registrarDescuento(VALIDO)).rejects.toThrow('El cine seleccionado no existe')
    expect(repositorio.crearDescuento).not.toHaveBeenCalled()
  })

  it('rechaza si alguna película no existe o está eliminada', async () => {
    repositorio.contarPeliculasActivas.mockResolvedValue(1)

    await expect(registrarDescuento(VALIDO)).rejects.toThrow('Una de las películas seleccionadas no existe')
    expect(repositorio.crearDescuento).not.toHaveBeenCalled()
  })

  it('responde con conflicto cuando otro descuento ya cubre la película en ese cine y periodo', async () => {
    repositorio.buscarChoqueDeDescuento.mockResolvedValue({ nombre: 'Semana de estrenos', titulo: 'Clayface' })

    const error = await registrarDescuento(VALIDO).catch((fallo) => fallo)

    expect(error instanceof ErrorConflicto).toBe(true)
    expect(error.message).toBe('El descuento "Semana de estrenos" ya aplica a "Clayface" en ese cine durante ese periodo')
    expect(repositorio.crearDescuento).not.toHaveBeenCalled()
  })
})

describe('desactivarDescuento', () => {
  it('desactiva el descuento con el id numérico', async () => {
    repositorio.desactivarDescuento.mockResolvedValue(true)

    await desactivarDescuento('7')

    expect(repositorio.desactivarDescuento).toHaveBeenCalledWith(7)
  })

  it('rechaza un identificador inválido sin tocar la base de datos', async () => {
    await expect(desactivarDescuento('abc')).rejects.toThrow('El identificador del descuento no es válido')
    expect(repositorio.desactivarDescuento).not.toHaveBeenCalled()
  })

  it('lanza no encontrado si no existe o ya estaba eliminado', async () => {
    repositorio.desactivarDescuento.mockResolvedValue(false)

    await expect(desactivarDescuento(7)).rejects.toThrow('El descuento no existe o ya fue eliminado')
    await desactivarDescuento(7).catch((error) => expect(error instanceof ErrorNoEncontrado).toBe(true))
  })
})
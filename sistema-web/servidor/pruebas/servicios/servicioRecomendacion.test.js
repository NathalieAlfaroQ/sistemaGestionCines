import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioRecomendacion.js', () => ({ puntajesDePeliculas: vi.fn() }))
vi.mock('../../src/servicios/servicioCartelera.js', () => ({ consultarCartelera: vi.fn() }))

import * as repositorio from '../../src/repositorios/repositorioRecomendacion.js'
import { consultarCartelera } from '../../src/servicios/servicioCartelera.js'
import { consultarRecomendaciones } from '../../src/servicios/servicioRecomendacion.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'

const pelicula = (id, titulo) => [id, titulo, 100, 'B', `portada-${id}`, `carrusel-${id}`]
// La cartelera llega ordenada por título
const CARTELERA = [pelicula(1, 'Alien'), pelicula(2, 'Barbie'), pelicula(3, 'Clayface'), pelicula(4, 'Dune'), pelicula(5, 'Encanto')]
const CLIENTE = { tipoUsuario: 'CLIENTE', idCliente: 7 }
const idsDe = (peliculas) => peliculas.map((fila) => fila[0])

beforeEach(() => {
  vi.resetAllMocks()
  consultarCartelera.mockResolvedValue(CARTELERA)
  repositorio.puntajesDePeliculas.mockResolvedValue([])
})

describe('consultarRecomendaciones', () => {
  it('consulta la cartelera del cine pedido', async () => {
    await consultarRecomendaciones(CLIENTE, '3')

    expect(consultarCartelera).toHaveBeenCalledWith('3')
  })

  it('ordena de mayor a menor puntaje y deja fuera las películas sin puntaje', async () => {
    // Perfil: 62,5 % terror, 25 % acción, 12,5 % comedia
    repositorio.puntajesDePeliculas.mockResolvedValue([[1, 0.625], [2, 0.875], [3, 0.125], [4, 0.75]])

    const resultado = await consultarRecomendaciones(CLIENTE, '1')

    expect(idsDe(resultado)).toEqual([2, 4, 1, 3])
  })

  it('devuelve las filas de la cartelera tal cual, con el mismo formato', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([[2, 0.5]])

    expect(await consultarRecomendaciones(CLIENTE, '1')).toEqual([pelicula(2, 'Barbie')])
  })

  it('si empatan queda primero la que va antes en la cartelera', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([[4, 0.5], [2, 0.5], [3, 0.5]])

    expect(idsDe(await consultarRecomendaciones(CLIENTE, '1'))).toEqual([2, 3, 4])
  })

  it('trata como empate los puntajes que solo difieren en los decimales finales', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([[3, 0.6666666666666667], [1, 0.6666666666666666], [2, 0.7]])

    expect(idsDe(await consultarRecomendaciones(CLIENTE, '1'))).toEqual([2, 1, 3])
  })

  it('acepta los ids y puntajes como texto', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([['2', '0.25'], ['1', '0.75']])

    expect(idsDe(await consultarRecomendaciones(CLIENTE, '1'))).toEqual([1, 2])
  })

  it('ignora el puntaje de películas que no están en la cartelera del cine', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([[99, 0.9], [2, 0.1]])

    expect(idsDe(await consultarRecomendaciones(CLIENTE, '1'))).toEqual([2])
  })

  it('un puntaje de cero no cuenta como coincidencia', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([[1, 0], [2, 0.3]])

    expect(idsDe(await consultarRecomendaciones(CLIENTE, '1'))).toEqual([2])
  })

  it('consulta los puntajes del cliente de la sesión', async () => {
    await consultarRecomendaciones({ tipoUsuario: 'CLIENTE', idCliente: 12 }, '1')

    expect(repositorio.puntajesDePeliculas).toHaveBeenCalledWith(12)
  })

  it('un cliente sin compras no recibe recomendaciones', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([])

    expect(await consultarRecomendaciones(CLIENTE, '1')).toEqual([])
  })

  it('si ninguna película en cartelera coincide con sus gustos no recibe recomendaciones', async () => {
    repositorio.puntajesDePeliculas.mockResolvedValue([[99, 0.9]])

    expect(await consultarRecomendaciones(CLIENTE, '1')).toEqual([])
  })

  it.each([
    ['un visitante sin sesión', undefined],
    ['una sesión vacía', {}],
    ['un empleado', { tipoUsuario: 'EMPLEADO', idEmpleado: 3 }],
    ['un administrador', { tipoUsuario: 'ADMINISTRADOR', idCliente: 7 }],
    ['un cliente de un token antiguo, sin idCliente', { tipoUsuario: 'CLIENTE' }],
    ['un idCliente de texto', { tipoUsuario: 'CLIENTE', idCliente: '7' }],
    ['un idCliente con SQL', { tipoUsuario: 'CLIENTE', idCliente: '7 OR 1=1' }],
    ['un idCliente decimal', { tipoUsuario: 'CLIENTE', idCliente: 7.5 }],
    ['un idCliente cero', { tipoUsuario: 'CLIENTE', idCliente: 0 }],
    ['un idCliente negativo', { tipoUsuario: 'CLIENTE', idCliente: -4 }],
  ])('para %s no hay recomendaciones y no consulta nada', async (descripcion, usuario) => {
    expect(await consultarRecomendaciones(usuario, '1')).toEqual([])
    expect(repositorio.puntajesDePeliculas).not.toHaveBeenCalled()
    expect(consultarCartelera).not.toHaveBeenCalled()
  })

  it('si la cartelera falla (por ejemplo el cine no existe) propaga el error y no consulta puntajes', async () => {
    consultarCartelera.mockRejectedValue(new ErrorNoEncontrado('La sede no existe'))

    const error = await consultarRecomendaciones(CLIENTE, '99').catch((fallo) => fallo)

    expect(error instanceof ErrorNoEncontrado).toBe(true)
    expect(repositorio.puntajesDePeliculas).not.toHaveBeenCalled()
  })

  it('no modifica la cartelera que recibe', async () => {
    const copia = CARTELERA.map((fila) => [...fila])
    repositorio.puntajesDePeliculas.mockResolvedValue([[4, 0.9], [1, 0.1]])

    await consultarRecomendaciones(CLIENTE, '1')

    expect(CARTELERA).toEqual(copia)
  })
})
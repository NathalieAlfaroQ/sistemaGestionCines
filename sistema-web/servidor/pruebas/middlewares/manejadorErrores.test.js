import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { manejadorErrores } from '../../src/middlewares/manejadorErrores.js'
import { ErrorConflicto } from '../../src/errores/ErrorConflicto.js';
import { ErrorNoAutorizado } from '../../src/errores/ErrorNoAutorizado.js';
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js';
import { ErrorProhibido } from '../../src/errores/ErrorProhibido.js';
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js';

// res falso: status() devuelve el mismo objeto para poder encadenar .json()
function crearRes() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

function ejecutar(error) {
  const res = crearRes()
  manejadorErrores(error, {}, res, vi.fn())
  return res
}

describe('manejadorErrores', () => {
  beforeEach(() => {
    // Silencia console.error para que las pruebas no ensucien la salida
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it ('responde 400 con el mensaje de ErrorValidacion', () => {
    const res = ejecutar(new ErrorValidacion('El campo "nombre" es obligatorio'))

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El campo "nombre" es obligatorio' })
  })

  it('responde 401 con el mensaje de ErrorNoAutorizado', () => {
    const res = ejecutar(new ErrorNoAutorizado('La sesión ha expirado'))

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sesión ha expirado' })
  })
  
  it('responde 403 con el mensaje de ErrorProhibido', () => {
    const res = ejecutar(new ErrorProhibido('No tienes permiso para realizar esta acción'))
    
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para realizar esta acción' })
  })
  
  it ('responde 404 con el mensaje de ErrorNoEncontrado', () => {
    const res = ejecutar(new ErrorNoEncontrado('El recurso solicitado no existe'))

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El recurso solicitado no existe' })
  })

  it('responde 409 con el mensaje de ErrorConflicto', () => {
    const res = ejecutar(new ErrorConflicto('El recurso ya existe'))

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El recurso ya existe' })
  })

  it.each([400, 499])('respeta el estado %i de un error del cliente sin mostrar su detalle', (estado) => {
    const error = Object.assign(new Error('Unexpected token r in JSON at position 1'), { status: estado })

    const res = ejecutar(error)

    expect(res.status).toHaveBeenCalledWith(estado)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Solicitud inválida' })
  })

  it.each([
    ['sin estado', undefined],
    ['con estado 399', 399],
    ['con estado 500', 500],
    ['con estado 503', 503],
  ])('responde 500 genérico a un error %s', (_, estado) => {
    const error = Object.assign(new Error('detalle interno: tabla X no existe'), { status: estado })

    const res = ejecutar(error)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error interno del servidor' })
  })

  it('registra el error en consola cuando es un error interno', () => {
    const error = new Error('fallo inesperado')

    ejecutar(error)

    expect(console.error).toHaveBeenCalledWith(error)
  })
})
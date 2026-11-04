import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { verificarAutenticacion } from '../../src/middlewares/autenticacion.js'
import { generarToken } from '../../src/servicios/servicioToken.js'
import { ErrorNoAutorizado } from '../../src/errores/ErrorNoAutorizado.js'

// Ejecuta el middleware con un header Authorization y devuelve lo observable
function ejecutar(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } }
  const next = vi.fn()

  verificarAutenticacion(req, {}, next)

  return { req, next }
}

// El error con el que se llamó a next (primer argumento de la primera llamada)
function errorDe(next) {
  return next.mock.calls[0][0]
}

describe('verificarAutenticacion', () => {
  it.each([
    ['sin header Authorization', undefined],
    ['con un esquema distinto de Bearer', 'Basic abc123'],
  ])('rechaza la petición %s', (_, authorization) => {
    const { req, next } = ejecutar(authorization)

    expect(next).toHaveBeenCalledTimes(1)
    expect(errorDe(next)).toBeInstanceOf(ErrorNoAutorizado)
    expect(errorDe(next).message).toBe('Token de autenticación no proporcionado')
    expect(req.usuario).toBeUndefined()
  })

  it.each([
    ['con "Bearer " sin token', 'Bearer '],
    ['con un token que no es un JWT', 'Bearer abc'],
    ['con un token con la carga ilegible', `Bearer ${generarToken({ idCredencial: 7 })}x`],
  ])('rechaza la petición %s como inválida', (_, authorization) => {
    const { req, next } = ejecutar(authorization)

    expect(next).toHaveBeenCalledTimes(1)
    expect(errorDe(next)).toBeInstanceOf(ErrorNoAutorizado)
    expect(errorDe(next).message).toBe('Token de autenticación inválido')
    expect(req.usuario).toBeUndefined()
  })

  it('responde "La sesión ha expirado" con un token vencido', () => {
    const vencido = jwt.sign({ idCredencial: 7 }, 'secreto-de-prueba', { expiresIn: -10 })

    const { req, next } = ejecutar(`Bearer ${vencido}`)

    expect(next).toHaveBeenCalledTimes(1)
    expect(errorDe(next)).toBeInstanceOf(ErrorNoAutorizado)
    expect(errorDe(next).message).toBe('La sesión ha expirado')
    expect(req.usuario).toBeUndefined()
  })

  it('con un token válido deja la carga en req.usuario y continúa sin error', () => {
    const token = generarToken({ idCredencial: 7, tipoUsuario: 'CLIENTE' })

    const { req, next } = ejecutar(`Bearer ${token}`)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
    expect(req.usuario.idCredencial).toBe(7)
    expect(req.usuario.tipoUsuario).toBe('CLIENTE')
  })
})
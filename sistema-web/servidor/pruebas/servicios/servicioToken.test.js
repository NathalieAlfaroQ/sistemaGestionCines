import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { generarToken, verificarToken } from '../../src/servicios/servicioToken.js'

// Devuelve el error que lanza una función, o undefined si no lanza ninguno
function capturarError(funcion) {
  try {
    funcion()
  } catch (error) {
    return error
  }
}

describe('servicioToken', () => {
  it('genera un token que se verifica y devuelve la carga original', () => {
    const token = generarToken({ idCredencial: 7, tipoUsuario: 'CLIENTE' })
    const carga = verificarToken(token)

    expect(carga.idCredencial).toBe(7)
    expect(carga.tipoUsuario).toBe('CLIENTE')
    expect(carga.exp - carga.iat).toBe(3600)
  })

  it('rechaza un token con la carga modificada y la firma original', () => {
    const [encabezado, , firma] = generarToken({ idCredencial: 7, tipoUsuario: 'CLIENTE' }).split('.')
    const cargaFalsa = Buffer.from(
      JSON.stringify({ idCredencial: 7, tipoUsuario: 'ADMINISTRADOR' })
    ).toString('base64url')
    const falsificado = `${encabezado}.${cargaFalsa}.${firma}`

    const error = capturarError(() => verificarToken(falsificado))

    expect(error.name).toBe('JsonWebTokenError')
    expect(error.message).toBe('invalid signature')
  })

  it('rechaza un token con la carga ilegible', () => {
    const [encabezado, carga, firma] = generarToken({ idCredencial: 7 }).split('.')
    const corrupto = `${encabezado}.${carga}x.${firma}`

    expect(capturarError(() => verificarToken(corrupto))).toBeDefined()
  })

  it('rechaza un token firmado con otro secreto', () => {
    const ajeno = jwt.sign({ idCredencial: 7 }, 'otro-secreto', { algorithm: 'HS256' })

    expect(capturarError(() => verificarToken(ajeno)).name).toBe('JsonWebTokenError')
  })

  it('lanza TokenExpiredError con un token vencido', () => {
    const vencido = jwt.sign({ idCredencial: 7 }, 'secreto-de-prueba', { expiresIn: -10 })

    expect(capturarError(() => verificarToken(vencido)).name).toBe('TokenExpiredError')
  })

  it('rechaza un token sin firma (algoritmo none)', () => {
    const sinFirma = jwt.sign({ idCredencial: 7 }, '', { algorithm: 'none' })

    expect(capturarError(() => verificarToken(sinFirma))).toBeDefined()
  })
})
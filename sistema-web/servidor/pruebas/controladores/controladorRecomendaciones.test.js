import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/servicios/servicioRecomendacion.js', () => ({ consultarRecomendaciones: vi.fn() }))
vi.mock('../../src/servicios/servicioToken.js', () => ({ verificarToken: vi.fn() }))

import { consultarRecomendaciones } from '../../src/servicios/servicioRecomendacion.js'
import { verificarToken } from '../../src/servicios/servicioToken.js'
import { identificarUsuario, listarRecomendaciones } from '../../src/controladores/controladorRecomendacion.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'

function crearRes() {
  return { json: vi.fn() }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarRecomendaciones', () => {
  it('responde con las recomendaciones del usuario de la sesión y el cine pedido', async () => {
    const usuario = { tipoUsuario: 'CLIENTE', idCliente: 7 }
    consultarRecomendaciones.mockResolvedValue([[1, 'Alien']])
    const res = crearRes()
    const next = vi.fn()

    await listarRecomendaciones({ usuario, query: { idSede: '3', otro: 'ignorado' } }, res, next)

    expect(consultarRecomendaciones).toHaveBeenCalledWith(usuario, '3')
    expect(res.json).toHaveBeenCalledWith([[1, 'Alien']])
    expect(next).not.toHaveBeenCalled()
  })

  it('pasa el error al manejador de errores', async () => {
    const error = new ErrorNoEncontrado('La sede no existe')
    consultarRecomendaciones.mockRejectedValue(error)
    const res = crearRes()
    const next = vi.fn()

    await listarRecomendaciones({ query: { idSede: '99' } }, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('identificarUsuario', () => {
  it('con un token válido deja el usuario en la petición', () => {
    const usuario = { tipoUsuario: 'CLIENTE', idCliente: 7 }
    verificarToken.mockReturnValue(usuario)
    const req = { headers: { authorization: 'Bearer abc.def' } }
    const next = vi.fn()

    identificarUsuario(req, crearRes(), next)

    expect(verificarToken).toHaveBeenCalledWith('abc.def')
    expect(req.usuario).toBe(usuario)
    expect(next).toHaveBeenCalledWith()
  })

  it('sin encabezado sigue como visitante, sin responder error', () => {
    const req = { headers: {} }
    const next = vi.fn()

    identificarUsuario(req, crearRes(), next)

    expect(req.usuario).toBe(undefined)
    expect(verificarToken).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })

  it('con un encabezado que no es Bearer lo ignora', () => {
    const req = { headers: { authorization: 'Basic abc' } }
    const next = vi.fn()

    identificarUsuario(req, crearRes(), next)

    expect(req.usuario).toBe(undefined)
    expect(verificarToken).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })

  it('con un token inválido o vencido sigue como visitante, sin responder 401', () => {
    verificarToken.mockImplementation(() => {
      throw new Error('jwt expired')
    })
    const req = { headers: { authorization: 'Bearer vencido' } }
    const next = vi.fn()

    identificarUsuario(req, crearRes(), next)

    expect(req.usuario).toBe(undefined)
    expect(next).toHaveBeenCalledWith()
  })
})
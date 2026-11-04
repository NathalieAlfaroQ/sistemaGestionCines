import { describe, it, expect, vi } from 'vitest'
import { autorizarRoles } from '../../src/middlewares/autorizacion.js'
import { ErrorNoAutorizado } from '../../src/errores/ErrorNoAutorizado.js'
import { ErrorProhibido } from '../../src/errores/ErrorProhibido.js'

// Ejecuta el middleware ya configurado con los roles y devuelve el espía de next
function ejecutar(middleware, usuario) {
  const req = usuario === undefined ? {} : { usuario }
  const next = vi.fn()

  middleware(req, {}, next)

  return next
}

describe('autorizarRoles', () => {
  const soloPersonal = autorizarRoles('EMPLEADO', 'ADMINISTRADOR')

  it('responde no autorizado si no hay req.usuario (falta verificarAutenticacion antes)', () => {
    const next = ejecutar(soloPersonal, undefined)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0][0]).toBeInstanceOf(ErrorNoAutorizado)
  })

  it.each(['EMPLEADO', 'ADMINISTRADOR'])('deja pasar al rol %s', (rol) => {
    const next = ejecutar(soloPersonal, { tipoUsuario: rol })

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })

  it.each([
    ['CLIENTE', { tipoUsuario: 'CLIENTE' }],
    ['un rol desconocido', { tipoUsuario: 'INVITADO' }],
    ['un usuario sin tipoUsuario', { idCredencial: 7 }],
  ])('prohíbe el acceso a %s', (_, usuario) => {
    const next = ejecutar(soloPersonal, usuario)
    const error = next.mock.calls[0][0]

    expect(next).toHaveBeenCalledTimes(1)
    expect(error).toBeInstanceOf(ErrorProhibido)
    expect(error.message).toBe('No tienes permiso para realizar esta acción')
  })

  it('respeta la lista de roles con la que se creó', () => {
    const soloAdministrador = autorizarRoles('ADMINISTRADOR')

    expect(ejecutar(soloAdministrador, { tipoUsuario: 'ADMINISTRADOR' })).toHaveBeenCalledWith()
    expect(ejecutar(soloAdministrador, { tipoUsuario: 'EMPLEADO' }).mock.calls[0][0]).toBeInstanceOf(ErrorProhibido)
  })
})
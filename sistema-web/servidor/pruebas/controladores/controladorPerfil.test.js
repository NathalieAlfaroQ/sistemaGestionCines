import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/servicios/servicioPerfil.js', () => ({ actualizarPerfil: vi.fn() }))

import { actualizarPerfil as actualizar } from '../../src/servicios/servicioPerfil.js'
import { actualizarPerfil } from '../../src/controladores/controladorPerfil.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('actualizarPerfil', () => {
  it('actualiza al usuario de la sesión con lo que viene en el cuerpo y responde con lo que cambió', async () => {
    const usuario = { idCredencial: 9, tipoUsuario: 'CLIENTE' }
    actualizar.mockResolvedValue({ nombre: 'Ana' })
    const res = { json: vi.fn() }
    const next = vi.fn()

    await actualizarPerfil({ usuario, body: { nombre: ' Ana ', idCredencial: 1 } }, res, next)

    expect(actualizar).toHaveBeenCalledWith(usuario, { nombre: ' Ana ', idCredencial: 1 })
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Perfil actualizado', nombre: 'Ana' })
    expect(next).not.toHaveBeenCalled()
  })

  it('sin cuerpo manda un objeto vacío al servicio', async () => {
    actualizar.mockResolvedValue({})

    await actualizarPerfil({ usuario: {} }, { json: vi.fn() }, vi.fn())

    expect(actualizar).toHaveBeenCalledWith({}, {})
  })

  it('pasa el error al manejador de errores', async () => {
    const error = new ErrorValidacion('Faltan datos')
    actualizar.mockRejectedValue(error)
    const res = { json: vi.fn() }
    const next = vi.fn()

    await actualizarPerfil({ usuario: {}, body: {} }, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.json).not.toHaveBeenCalled()
  })
})
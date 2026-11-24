import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositorios/repositorioPerfil.js', () => ({ buscarCredencial: vi.fn(), actualizarNombre: vi.fn() }))

import * as repositorio from '../../src/repositorios/repositorioPerfil.js'
import { actualizarPerfil } from '../../src/servicios/servicioPerfil.js'
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js'
import { ErrorProhibido } from '../../src/errores/ErrorProhibido.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

const CLIENTE = { idCredencial: 9, tipoUsuario: 'CLIENTE', idCliente: 4 }
const EMPLEADO = { idCredencial: 10, tipoUsuario: 'EMPLEADO' }
const ADMINISTRADOR = { idCredencial: 11, tipoUsuario: 'ADMINISTRADOR' }
const GOOGLE = { idCliente: 21, tipoUsuario: 'CLIENTE', proveedor: 'GOOGLE' }

beforeEach(() => {
  vi.resetAllMocks()
  repositorio.buscarCredencial.mockResolvedValue(['CLIENTE', 4, null, null])
})

describe('actualizarPerfil: validación', () => {
  it('sin nombre ni apellido responde "Faltan datos"', async () => {
    await expect(actualizarPerfil(CLIENTE, {})).rejects.toBeInstanceOf(ErrorValidacion)
    await expect(actualizarPerfil(CLIENTE, {})).rejects.toThrow('Faltan datos')
    await expect(actualizarPerfil(CLIENTE)).rejects.toThrow('Faltan datos')
    expect(repositorio.actualizarNombre).not.toHaveBeenCalled()
  })

  it('un tipo de usuario desconocido en el token se rechaza', async () => {
    await expect(actualizarPerfil({ idCredencial: 1, tipoUsuario: 'OTRO' }, { nombre: 'Ana' })).rejects.toBeInstanceOf(ErrorProhibido)
    await expect(actualizarPerfil(undefined, { nombre: 'Ana' })).rejects.toBeInstanceOf(ErrorProhibido)
  })

  it('rechaza nombre vacío, solo espacios o que no sea texto', async () => {
    await expect(actualizarPerfil(CLIENTE, { nombre: '' })).rejects.toThrow('El nombre no puede quedar vacío')
    await expect(actualizarPerfil(CLIENTE, { nombre: '   ' })).rejects.toThrow('El nombre no puede quedar vacío')
    await expect(actualizarPerfil(CLIENTE, { apellido: 12 })).rejects.toThrow('El apellido no puede quedar vacío')
    await expect(actualizarPerfil(CLIENTE, { nombre: null })).rejects.toBeInstanceOf(ErrorValidacion)
  })

  it('rechaza números y símbolos, y acepta tildes, ñ y espacios', async () => {
    await expect(actualizarPerfil(CLIENTE, { nombre: 'Ana1' })).rejects.toThrow('solo se admiten letras')
    await expect(actualizarPerfil(CLIENTE, { apellido: 'Mora!' })).rejects.toThrow('solo se admiten letras')
    expect(await actualizarPerfil(CLIENTE, { nombre: 'José Ñandú Ünal' })).toEqual({ nombre: 'José Ñandú Ünal' })
  })

  it('el límite del cliente es 50 caracteres, el del personal 20', async () => {
    expect(await actualizarPerfil(CLIENTE, { nombre: 'a'.repeat(50) })).toEqual({ nombre: 'a'.repeat(50) })
    await expect(actualizarPerfil(CLIENTE, { nombre: 'a'.repeat(51) })).rejects.toThrow('no puede superar 50 caracteres')

    repositorio.buscarCredencial.mockResolvedValue(['EMPLEADO', null, 5, null])
    expect(await actualizarPerfil(EMPLEADO, { nombre: 'a'.repeat(20) })).toEqual({ nombre: 'a'.repeat(20) })
    await expect(actualizarPerfil(EMPLEADO, { nombre: 'a'.repeat(21) })).rejects.toThrow('no puede superar 20 caracteres')
    await expect(actualizarPerfil(ADMINISTRADOR, { apellido: 'a'.repeat(21) })).rejects.toThrow('no puede superar 20 caracteres')
  })

  it('el límite se mide sin los espacios sobrantes', async () => {
    expect(await actualizarPerfil(CLIENTE, { nombre: `  ${'a'.repeat(50)}  ` })).toEqual({ nombre: 'a'.repeat(50) })
  })

  it('si un campo es inválido no se guarda ninguno', async () => {
    await expect(actualizarPerfil(CLIENTE, { nombre: 'Ana', apellido: 'M0ra' })).rejects.toBeInstanceOf(ErrorValidacion)
    expect(repositorio.actualizarNombre).not.toHaveBeenCalled()
  })
})

describe('actualizarPerfil: a quién se actualiza', () => {
  it('usa el idCredencial del token, sea cual sea', async () => {
    await actualizarPerfil({ ...CLIENTE, idCredencial: 777 }, { nombre: 'Ana' })

    expect(repositorio.buscarCredencial).toHaveBeenCalledWith(777)
  })

  it('actualiza al cliente con el id que trae su credencial', async () => {
    await actualizarPerfil(CLIENTE, { nombre: 'Ana', apellido: 'Mora' })

    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('CLIENTE', 4, { nombre: 'Ana', apellido: 'Mora' })
  })

  it('actualiza al empleado y al administrador con su propio id', async () => {
    repositorio.buscarCredencial.mockResolvedValue(['EMPLEADO', null, 5, null])
    await actualizarPerfil(EMPLEADO, { nombre: 'Eva' })
    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('EMPLEADO', 5, { nombre: 'Eva', apellido: null })

    repositorio.buscarCredencial.mockResolvedValue(['ADMINISTRADOR', null, null, 6])
    await actualizarPerfil(ADMINISTRADOR, { apellido: 'Solis' })
    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('ADMINISTRADOR', 6, { nombre: null, apellido: 'Solis' })
  })

  it('una cuenta de Google se actualiza por el id de cliente del token, sin consultar credenciales', async () => {
    await actualizarPerfil(GOOGLE, { nombre: 'Gus' })

    expect(repositorio.buscarCredencial).not.toHaveBeenCalled()
    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('CLIENTE', 21, { nombre: 'Gus', apellido: null })
  })

  it('una sesión de Google sin id de cliente, o que no es cliente, es inválida', async () => {
    await expect(actualizarPerfil({ ...GOOGLE, idCliente: undefined }, { nombre: 'Gus' })).rejects.toThrow('Sesión inválida')
    await expect(actualizarPerfil({ ...GOOGLE, tipoUsuario: 'EMPLEADO' }, { nombre: 'Gus' })).rejects.toThrow('Sesión inválida')
  })

  it('un token sin idCredencial se trata como cuenta de Google aunque no traiga proveedor', async () => {
    await actualizarPerfil({ tipoUsuario: 'CLIENTE', idCliente: 21 }, { nombre: 'Gus' })
    await actualizarPerfil({ tipoUsuario: 'CLIENTE', idCliente: 21, idCredencial: null }, { nombre: 'Gus' })

    expect(repositorio.buscarCredencial).not.toHaveBeenCalled()
    expect(repositorio.actualizarNombre).toHaveBeenCalledTimes(2)
    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('CLIENTE', 21, { nombre: 'Gus', apellido: null })
  })

  it('un token sin idCredencial que no es de cliente o no trae idCliente es inválido', async () => {
    await expect(actualizarPerfil({ tipoUsuario: 'CLIENTE' }, { nombre: 'Ana' })).rejects.toBeInstanceOf(ErrorValidacion)
    await expect(actualizarPerfil({ tipoUsuario: 'EMPLEADO', idEmpleado: 5 }, { nombre: 'Ana' })).rejects.toThrow('Sesión inválida')
    expect(repositorio.actualizarNombre).not.toHaveBeenCalled()
  })

  it('un idCredencial que no es entero es inválido y no se consulta', async () => {
    await expect(actualizarPerfil({ ...CLIENTE, idCredencial: '9' }, { nombre: 'Ana' })).rejects.toThrow('Sesión inválida')
    expect(repositorio.buscarCredencial).not.toHaveBeenCalled()
  })

  it('si la credencial ya no existe responde no encontrada', async () => {
    repositorio.buscarCredencial.mockResolvedValue(null)

    await expect(actualizarPerfil(CLIENTE, { nombre: 'Ana' })).rejects.toBeInstanceOf(ErrorNoEncontrado)
    expect(repositorio.actualizarNombre).not.toHaveBeenCalled()
  })

  it('una credencial de tipo desconocido, o sin su id, se rechaza', async () => {
    repositorio.buscarCredencial.mockResolvedValue(['OTRO', 1, null, null])
    await expect(actualizarPerfil(CLIENTE, { nombre: 'Ana' })).rejects.toBeInstanceOf(ErrorProhibido)

    repositorio.buscarCredencial.mockResolvedValue(['CLIENTE', null, null, null])
    await expect(actualizarPerfil(CLIENTE, { nombre: 'Ana' })).rejects.toBeInstanceOf(ErrorProhibido)
    expect(repositorio.actualizarNombre).not.toHaveBeenCalled()
  })
})

describe('actualizarPerfil: resultado', () => {
  it('devuelve solo lo que cambió, sin espacios sobrantes', async () => {
    expect(await actualizarPerfil(CLIENTE, { nombre: '  Ana  ' })).toEqual({ nombre: 'Ana' })
    expect(await actualizarPerfil(CLIENTE, { apellido: ' Mora ' })).toEqual({ apellido: 'Mora' })
    expect(await actualizarPerfil(CLIENTE, { nombre: 'Ana', apellido: 'Mora' })).toEqual({ nombre: 'Ana', apellido: 'Mora' })
  })

  it('guarda los valores ya sin espacios sobrantes', async () => {
    await actualizarPerfil(CLIENTE, { nombre: '  Ana  ', apellido: ' Mora ' })

    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('CLIENTE', 4, { nombre: 'Ana', apellido: 'Mora' })
  })

  it('lo que no se envía llega null para que no se modifique', async () => {
    await actualizarPerfil(CLIENTE, { nombre: 'Ana' })

    expect(repositorio.actualizarNombre).toHaveBeenCalledWith('CLIENTE', 4, { nombre: 'Ana', apellido: null })
  })

  it('los errores del repositorio se propagan', async () => {
    repositorio.actualizarNombre.mockRejectedValue(new Error('ORA-00001'))

    await expect(actualizarPerfil(CLIENTE, { nombre: 'Ana' })).rejects.toThrow('ORA-00001')
  })
})
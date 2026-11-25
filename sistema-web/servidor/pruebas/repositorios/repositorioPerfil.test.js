import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/configuracion/baseDatos.js', () => ({ ejecutar: vi.fn() }))

import { ejecutar } from '../../src/configuracion/baseDatos.js'
import { actualizarNombre, buscarCredencial } from '../../src/repositorios/repositorioPerfil.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('buscarCredencial', () => {
  it('devuelve la fila de la credencial y manda el id como bind', async () => {
    ejecutar.mockResolvedValue({ rows: [['CLIENTE', 4, null, null]] })

    expect(await buscarCredencial(9)).toEqual(['CLIENTE', 4, null, null])

    const [sql, binds] = ejecutar.mock.calls[0]
    expect(binds).toEqual({ idCredencial: 9 })
    expect(sql).toContain('WHERE ID_CREDENCIAL = :idCredencial')
  })

  it('devuelve null si la credencial no existe', async () => {
    ejecutar.mockResolvedValue({ rows: [] })

    expect(await buscarCredencial(9)).toBe(null)
  })
})

describe('actualizarNombre', () => {
  it('actualiza CLIENTES por ID_CLIENTE', async () => {
    await actualizarNombre('CLIENTE', 4, { nombre: 'Ana', apellido: 'Mora' })

    const [sql, binds] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE CLIENTES')
    expect(sql).toContain('WHERE ID_CLIENTE = :id')
    expect(binds).toEqual({ nombre: 'Ana', apellido: 'Mora', id: 4 })
  })

  it('actualiza EMPLEADOS con sus columnas propias', async () => {
    await actualizarNombre('EMPLEADO', 5, { nombre: 'Eva', apellido: null })

    const [sql, binds] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE EMPLEADOS')
    expect(sql).toContain('NOMBRE_EMPLEADO = NVL(:nombre, NOMBRE_EMPLEADO)')
    expect(sql).toContain('WHERE ID_EMPLEADO = :id')
    expect(binds).toEqual({ nombre: 'Eva', apellido: null, id: 5 })
  })

  it('actualiza ADMINISTRADORES por ID_ADMINISTRADOR', async () => {
    await actualizarNombre('ADMINISTRADOR', 6, { nombre: null, apellido: 'Solis' })

    const [sql, binds] = ejecutar.mock.calls[0]
    expect(sql).toContain('UPDATE ADMINISTRADORES')
    expect(sql).toContain('WHERE ID_ADMINISTRADOR = :id')
    expect(binds).toEqual({ nombre: null, apellido: 'Solis', id: 6 })
  })

  it('deja intacta la columna cuando el valor llega null (NVL)', async () => {
    await actualizarNombre('CLIENTE', 4, { nombre: null, apellido: 'Mora' })

    const [sql] = ejecutar.mock.calls[0]
    expect(sql).toContain('NOMBRE = NVL(:nombre, NOMBRE)')
    expect(sql).toContain('APELLIDO = NVL(:apellido, APELLIDO)')
  })
})
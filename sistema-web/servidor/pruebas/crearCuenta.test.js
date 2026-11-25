import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// Simula la base de datos, el envío de correos y bcrypt
vi.mock('../src/db.js', () => ({ getConnection: vi.fn() }))
vi.mock('../src/enviarCorreo.js', () => ({ enviarCorreoContrasena: vi.fn().mockResolvedValue(true) }))
vi.mock('bcrypt', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt_falso'),
    hash: vi.fn().mockResolvedValue('hash_falso')
  }
}))

import { getConnection } from '../src/db.js'
import crearCuentaRouter from '../src/crearCuenta.js'

const app = express()
app.use(express.json())
app.use('/api/crear-cuenta', crearCuentaRouter)

describe('Rutas de crearCuenta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('debe rechazar la creación si faltan datos', async () => {
    const res = await request(app).post('/api/crear-cuenta/cliente').send({ nombre: 'Juan' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Error al cargar la pantalla, intente luego.')
  })

  it('debe rechazar si el correo ya existe', async () => {
    const mockConnection = {
      execute: vi.fn().mockResolvedValueOnce({ rows: [[1]] }), 
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).post('/api/crear-cuenta/cliente').send({
      nombre: 'Juan', apellido: 'Perez', correo: 'juan@test.com'
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('X Correo inválido')
  })

  it('debe crear un cliente y llamar a la base de datos correctamente', async () => {
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [] }) // correoExiste (no existe)
        .mockResolvedValueOnce({ outBinds: { idCliente: [1] } }) // Insert Cliente
        .mockResolvedValueOnce({ outBinds: { idCredencial: [10] } }), // Insert Credencial
      commit: vi.fn(),
      rollback: vi.fn(),
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).post('/api/crear-cuenta/cliente').send({
      nombre: 'Juan', apellido: 'Perez', correo: 'juan@test.com'
    })

    expect(res.status).toBe(201)
    expect(res.body.mensaje).toBe('Cuenta creada. Revisa tu correo.')
    expect(mockConnection.commit).toHaveBeenCalled()
  })
})
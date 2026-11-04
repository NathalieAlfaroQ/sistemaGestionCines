import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../src/db.js', () => ({ getConnection: vi.fn() }))
vi.mock('../src/enviarCorreo.js', () => ({ enviarCorreoContrasena: vi.fn().mockResolvedValue(true) }))
vi.mock('bcrypt', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt_falso'),
    hash: vi.fn().mockResolvedValue('hash_falso')
  }
}))

import { getConnection } from '../src/db.js'
import recuperarContrasenaRouter from '../src/recuperarContrasena.js'

const app = express()
app.use(express.json())
app.use('/api/recuperar-contrasena', recuperarContrasenaRouter)

describe('Rutas de recuperarContrasena', () => {
  beforeEach(() => vi.clearAllMocks())

  it('debe rechazar si no se envía correo', async () => {
    const res = await request(app).post('/api/recuperar-contrasena').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Espacio obligatorio')
  })

  it('debe devolver 404 si el correo no está registrado', async () => {
    const mockConnection = { execute: vi.fn().mockResolvedValueOnce({ rows: [] }), close: vi.fn() }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).post('/api/recuperar-contrasena').send({ correo: 'noexiste@test.com' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('X Correo inválido')
  })

  it('debe generar contraseña temporal y actualizar la BD', async () => {
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [[1, 'CLIENTE', 5, null, null]] }) 
        .mockResolvedValueOnce({ rows: [['Juan']] }) 
        .mockResolvedValueOnce({}), 
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).post('/api/recuperar-contrasena').send({ correo: 'juan@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Contraseña temporal enviada. Revisa tu correo.')
    expect(mockConnection.execute).toHaveBeenCalledTimes(3)
  })
})
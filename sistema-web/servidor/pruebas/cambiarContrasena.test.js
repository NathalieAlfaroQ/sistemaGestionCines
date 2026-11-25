import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../src/db.js', () => ({ getConnection: vi.fn() }))
vi.mock('bcrypt', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt_falso'),
    hash: vi.fn().mockResolvedValue('hash_falso')
  }
}))

import { getConnection } from '../src/db.js'
import cambiarContrasenaRouter from '../src/cambiarContrasena.js'

const app = express()
app.use(express.json())
app.use('/api/cambiar-contrasena', cambiarContrasenaRouter)

describe('Rutas de cambiarContrasena', () => {
  beforeEach(() => vi.clearAllMocks())

  it('debe rechazar si faltan campos', async () => {
    const res = await request(app).post('/api/cambiar-contrasena').send({ correo: 'juan@test.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Espacios obligatorios')
  })

  it('debe rechazar si la contraseña no es segura (ej. sin mayúsculas)', async () => {
    const res = await request(app).post('/api/cambiar-contrasena').send({
      correo: 'juan@test.com', contrasenaNueva: 'debil123'
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('X Contraseña no segura')
  })

  it('debe rechazar si la contraseña no tiene 12 caracteres', async () => {
    const res = await request(app).post('/api/cambiar-contrasena').send({
      correo: 'juan@test.com', contrasenaNueva: 'Ab1@' 
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('X Contraseña no segura')
  })

  it('debe cambiar la contraseña correctamente si cumple todos los requisitos', async () => {
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [[10]] }) 
        .mockResolvedValueOnce({}), 
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).post('/api/cambiar-contrasena').send({
      correo: 'juan@test.com', 
      contrasenaNueva: 'NuevaPass123@' 
    })

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Contraseña actualizada')
    expect(mockConnection.execute).toHaveBeenCalledTimes(2)
  })
})
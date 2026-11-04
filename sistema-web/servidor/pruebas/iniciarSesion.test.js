import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../src/db.js', () => ({ getConnection: vi.fn() }))
vi.mock('../src/servicios/servicioToken.js', () => ({ generarToken: vi.fn().mockReturnValue('token_falso') }))
vi.mock('bcrypt', () => ({
  default: { compare: vi.fn() } 
}))

import { getConnection } from '../src/db.js'
import bcrypt from 'bcrypt'
import iniciarSesionRouter from '../src/iniciarSesion.js'

const app = express()
app.use(express.json())
app.use('/api/iniciar-sesion', iniciarSesionRouter)

describe('Rutas de iniciarSesion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('debe rechazar si faltan credenciales', async () => {
    const res = await request(app).post('/api/iniciar-sesion').send({ correo: 'juan@test.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Correo y contraseña son obligatorios')
  })

  it('debe rechazar si el usuario no existe', async () => {
    const mockConnection = { execute: vi.fn().mockResolvedValueOnce({ rows: [] }), close: vi.fn() }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).post('/api/iniciar-sesion').send({ correo: 'noexiste@test.com', contrasena: '123' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('X Credenciales inválidas')
  })

  it('debe iniciar sesión correctamente con credenciales válidas (contraseña normal)', async () => {
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [[1, 'juan@test.com', 'hash', 'salt', 'CLIENTE', null, 5, null, null]] }) 
        .mockResolvedValueOnce({ rows: [['Juan', 'Perez']] }), 
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)
    bcrypt.compare.mockResolvedValue(true) 

    const res = await request(app).post('/api/iniciar-sesion').send({ correo: 'juan@test.com', contrasena: '123' })
    
    expect(res.status).toBe(200)
    expect(res.body.token).toBe('token_falso')
    expect(res.body.usuario.nombre).toBe('Juan')
    expect(res.body.usuario.contrasenaTemporal).toBe(false)
  })
})
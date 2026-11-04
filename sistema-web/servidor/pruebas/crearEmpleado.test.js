import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../src/db.js', () => {
  return {
    getConnection: vi.fn()
  }
})

vi.mock('../src/enviarCorreo.js', () => ({
  enviarCorreoContrasena: vi.fn().mockResolvedValue(true)
}))

import { getConnection } from '../src/db.js'
import crearEmpleadoRouter from '../src/crearEmpleado.js'

const app = express()
app.use(express.json())
app.use('/api/crear-empleado', crearEmpleadoRouter)

describe('Rutas de crearEmpleado', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe rechazar la creación si faltan datos obligatorios', async () => {
    const res = await request(app)
      .post('/api/crear-empleado/interno')
      .send({ nombre: 'Juan' }) // Faltan apellido y correo

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Todos los campos son obligatorios')
  })

  it('debe crear un empleado correctamente si los datos son válidos', async () => {
    // Simula las respuestas de Oracle (3 consultas exitosas)
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [['ADMINISTRADOR']] }) // checkAdmin (es admin)
        .mockResolvedValueOnce({ rows: [] })                  //  checkCorreo (no existe)
        .mockResolvedValueOnce({ outBinds: { idEmpleado: [1] } }) //  Insert Empleado
        .mockResolvedValueOnce({})                            // Insert Credencial
        .mockResolvedValueOnce({}),                           //  (opcional) extra
      commit: vi.fn(),
      rollback: vi.fn(),
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app)
      .post('/api/crear-empleado/interno')
      .send({
        nombre: 'Juan', apellido: 'Perez', correo: 'juan@test.com',
        tipoUsuario: 'EMPLEADO', idSede: 1, idCreador: 99
      })

    expect(res.status).toBe(201)
    expect(res.body.mensaje).toBe('Usuario creado. Revisa su correo.')
  })

  it('debe rechazar si el correo ya existe', async () => {
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [['ADMINISTRADOR']] }) 
        .mockResolvedValueOnce({ rows: [[1]] }),             
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app)
      .post('/api/crear-empleado/interno')
      .send({
        nombre: 'Juan', apellido: 'Perez', correo: 'juan@test.com',
        tipoUsuario: 'EMPLEADO', idSede: 1, idCreador: 99
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Correo inválido')
  })

  it('debe editar un empleado correctamente', async () => {
    const mockConnection = {
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [['ADMINISTRADOR']] }) 
        .mockResolvedValueOnce({}) 
        .mockResolvedValueOnce({}), 
      commit: vi.fn(),
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app)
      .put('/api/crear-empleado/editar/1')
      .send({
        nombre: 'Juan Editado', apellido: 'Perez', correo: 'juan@test.com',
        tipoUsuario: 'EMPLEADO', idSede: 2, idCreador: 99
      })

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Usuario actualizado')
  })

  it('debe listar empleados y administradores', async () => {
    const mockConnection = {
      execute: vi.fn()
        // Simula empleados
        .mockResolvedValueOnce({ 
          rows: [
            [1, 'Juan', 'Perez', 'juan@test.com', 'EMPLEADO', 'Sede Central', 1]
          ] 
        })
        // Simula administradores
        .mockResolvedValueOnce({ 
          rows: [
            [2, 'Ana', 'Lopez', 'ana@test.com', 'ADMINISTRADOR', 'N/A']
          ] 
        }),
      close: vi.fn()
    }
    getConnection.mockResolvedValue(mockConnection)

    const res = await request(app).get('/api/crear-empleado/listar')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].nombreCompleto).toBe('Juan Perez')
    expect(res.body[1].nombreCompleto).toBe('Ana Lopez')
  })
})
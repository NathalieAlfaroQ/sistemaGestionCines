import request from 'supertest';
import express from 'express';
import dulceriaRouter from '../src/rutas/dulceria.js'; 
import { getConnection } from '../src/db.js';

// 1. Hacemos "Mock" de la base de datos para no conectarnos a Oracle real
jest.mock('../src/db.js', () => ({
  getConnection: jest.fn(),
}));

// 2. Hacemos "Mock" de las constantes
jest.mock('../src/constantes/constantes.js', () => ({
  MENSAJES: { SERVIDOR: 'Error en el servidor' }
}));

const app = express();
app.use(express.json());
app.use('/api/dulceria', dulceriaRouter);

describe('Pruebas Unitarias - Rutas de Dulcería', () => {
  
  let mockConnection;

  beforeEach(() => {
    // Creamos una conexión falsa para cada prueba
    mockConnection = {
      execute: jest.fn(),
      close: jest.fn(),
      rollback: jest.fn(),
      commit: jest.fn(),
    };
    getConnection.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // PRUEBA 1: Rechazar petición si el ID de credencial no existe o no es admin/empleado
  it('Debe retornar 403 si el usuario no tiene permisos o no existe', async () => {
    // Simulamos que la BD no encuentra la credencial
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/dulceria/listar?idCredencial=999');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('No tienes permisos');
    expect(mockConnection.close).toHaveBeenCalled();
  });

  // PRUEBA 2: Rechazar la creación si el precio es negativo o cero
  it('Debe retornar 400 si el precio es inválido al crear un producto', async () => {
    // Simulamos que SÍ es admin (para que pase el primer filtro)
    mockConnection.execute.mockResolvedValueOnce({ 
      rows: [['ADMINISTRADOR', 1]] // TIPO_USUARIO, ID_SEDE
    });

    const res = await request(app)
      .post('/api/dulceria/crear')
      .send({
        idCredencial: 1,
        nombre: 'Palomitas',
        precio: -5, // Precio inválido
        cantidad: 10
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Precio inválido');
    expect(mockConnection.rollback).toHaveBeenCalled();
  });

  // PRUEBA 3: Rechazar la creación si el nombre supera los 20 caracteres
  it('Debe retornar 400 si el nombre excede los 20 caracteres', async () => {
    mockConnection.execute.mockResolvedValueOnce({ 
      rows: [['ADMINISTRADOR', 1]] 
    });

    const res = await request(app)
      .post('/api/dulceria/crear')
      .send({
        idCredencial: 1,
        nombre: 'Este es un nombre exageradamente largo para un producto', // > 20 chars
        precio: 5.5,
        cantidad: 10
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Nombre inválido');
  });

  // PRUEBA 4: Evitar duplicados en la misma sede
  it('Debe retornar 409 si el producto ya existe en la sucursal', async () => {
    // 1. Permiso (Admin)
    mockConnection.execute.mockResolvedValueOnce({ rows: [['ADMINISTRADOR', 1]] });
    // 2. El producto ya existe en el catálogo
    mockConnection.execute.mockResolvedValueOnce({ rows: [[100]] }); // ID_PRODUCTO = 100
    // 3. El producto ya está en la sede
    mockConnection.execute.mockResolvedValueOnce({ rows: [[1]] }); 

    const res = await request(app)
      .post('/api/dulceria/crear')
      .send({
        idCredencial: 1,
        nombre: 'Coca Cola',
        precio: 2.5,
        cantidad: 10
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Este producto ya existe en tu sucursal');
  });

  // PRUEBA 5: Fallo controlado del servidor (Error de Base de Datos)
  it('Debe retornar 500 si hay un error inesperado en la base de datos al eliminar', async () => {
    // 1. Permiso (Admin)
    mockConnection.execute.mockResolvedValueOnce({ rows: [['ADMINISTRADOR', 1]] });
    // 2. Simulamos un error de Oracle al intentar borrar
    mockConnection.execute.mockRejectedValueOnce(new Error('ORA-00942: table or view does not exist'));

    const res = await request(app)
      .delete('/api/dulceria/eliminar/5')
      .send({ idCredencial: 1 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error en el servidor');
    expect(mockConnection.rollback).toHaveBeenCalled();
  });

});
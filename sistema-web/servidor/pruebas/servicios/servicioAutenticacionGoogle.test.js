import { describe, it, expect, vi, beforeEach } from 'vitest';

const { verificarTokenGoogle, generarToken, buscarPorIdGoogle, crearClienteConGoogle } = vi.hoisted(() => ({
  verificarTokenGoogle: vi.fn(),
  generarToken: vi.fn(),
  buscarPorIdGoogle: vi.fn(),
  crearClienteConGoogle: vi.fn(),
}));

vi.mock('../../src/servicios/servicioGoogle.js', () => ({ verificarTokenGoogle }));
vi.mock('../../src/servicios/servicioToken.js', () => ({ generarToken }));
vi.mock('../../src/repositorios/repositorioGoogle.js', () => ({
  buscarPorIdGoogle,
  crearClienteConGoogle,
}));

import { iniciarSesionConGoogle } from '../../src/servicios/servicioAutenticacionGoogle.js';
import { ErrorNoAutenticado } from '../../src/errores/ErrorNoAutenticado.js';

const datosGoogle = {
  idGoogle: '123',
  correo: 'ana@gmail.com',
  nombre: 'Ana',
  apellido: 'Mora',
};

describe('SCRUM-35: iniciarSesionConGoogle', () => {
  beforeEach(() => {
    verificarTokenGoogle.mockReset().mockResolvedValue(datosGoogle);
    generarToken.mockReset().mockReturnValue('token-prueba');
    buscarPorIdGoogle.mockReset();
    crearClienteConGoogle.mockReset();
  });

  it('inicia sesión con un cliente existente sin crear otro', async () => {
    buscarPorIdGoogle.mockResolvedValue([21, 'Ana', 'Mora']);

    const resultado = await iniciarSesionConGoogle('credencial-valida');

    expect(crearClienteConGoogle).not.toHaveBeenCalled();
    expect(generarToken).toHaveBeenCalledWith({
      idCliente: 21,
      tipoUsuario: 'CLIENTE',
      proveedor: 'GOOGLE',
    });
    expect(resultado).toEqual({
      mensaje: 'Inicio de sesión exitoso',
      token: 'token-prueba',
      usuario: {
        idCliente: 21,
        correo: 'ana@gmail.com',
        tipoUsuario: 'CLIENTE',
        nombre: 'Ana',
        apellido: 'Mora',
      },
    });
  });

  it('crea el cliente la primera vez y responde con sus datos', async () => {
    buscarPorIdGoogle.mockResolvedValue(null);
    crearClienteConGoogle.mockResolvedValue(7);

    const resultado = await iniciarSesionConGoogle('credencial-valida');

    expect(crearClienteConGoogle).toHaveBeenCalledWith(datosGoogle);
    expect(generarToken).toHaveBeenCalledWith({
      idCliente: 7,
      tipoUsuario: 'CLIENTE',
      proveedor: 'GOOGLE',
    });
    expect(resultado.usuario).toEqual({
      idCliente: 7,
      correo: 'ana@gmail.com',
      tipoUsuario: 'CLIENTE',
      nombre: 'Ana',
      apellido: 'Mora',
    });
  });

  it('recorta nombre y apellido a 50 caracteres antes de guardarlos', async () => {
    verificarTokenGoogle.mockResolvedValue({
      ...datosGoogle,
      nombre: 'N'.repeat(80),
      apellido: 'A'.repeat(80),
    });
    buscarPorIdGoogle.mockResolvedValue(null);
    crearClienteConGoogle.mockResolvedValue(8);

    const resultado = await iniciarSesionConGoogle('credencial-valida');

    expect(crearClienteConGoogle).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'N'.repeat(50), apellido: 'A'.repeat(50) }),
    );
    expect(resultado.usuario.nombre).toHaveLength(50);
    expect(resultado.usuario.apellido).toHaveLength(50);
  });

  it('usa el cliente ya creado si otra petición lo registró al mismo tiempo', async () => {
    buscarPorIdGoogle
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([9, 'Ana', 'Mora']);
    crearClienteConGoogle.mockRejectedValue(Object.assign(new Error('duplicado'), { errorNum: 1 }));

    const resultado = await iniciarSesionConGoogle('credencial-valida');

    expect(buscarPorIdGoogle).toHaveBeenCalledTimes(2);
    expect(resultado.usuario.idCliente).toBe(9);
    expect(generarToken).toHaveBeenCalledWith({
      idCliente: 9,
      tipoUsuario: 'CLIENTE',
      proveedor: 'GOOGLE',
    });
  });

  it('relanza los errores de base de datos que no son de duplicado y no emite token', async () => {
    buscarPorIdGoogle.mockResolvedValue(null);
    crearClienteConGoogle.mockRejectedValue(Object.assign(new Error('falla'), { errorNum: 12541 }));

    await expect(iniciarSesionConGoogle('credencial-valida')).rejects.toThrow('falla');

    expect(buscarPorIdGoogle).toHaveBeenCalledTimes(1);
    expect(generarToken).not.toHaveBeenCalled();
  });

  it('no consulta la base de datos si la credencial de Google no es válida', async () => {
    verificarTokenGoogle.mockRejectedValue(new ErrorNoAutenticado('La credencial de Google no es válida'));

    await expect(iniciarSesionConGoogle('abc')).rejects.toBeInstanceOf(ErrorNoAutenticado);

    expect(buscarPorIdGoogle).not.toHaveBeenCalled();
    expect(generarToken).not.toHaveBeenCalled();
  });
});
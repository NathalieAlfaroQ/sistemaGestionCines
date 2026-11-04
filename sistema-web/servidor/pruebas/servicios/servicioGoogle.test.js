import { describe, it, expect, vi, beforeEach } from 'vitest';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock('../../src/configuracion/google.js', () => ({
  clienteGoogle: { verifyIdToken },
  configuracionGoogle: { idCliente: 'id-cliente-prueba' },
}));

import { verificarTokenGoogle } from '../../src/servicios/servicioGoogle.js';
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js';
import { ErrorNoAutenticado } from '../../src/errores/ErrorNoAutenticado.js';

function respuestaGoogle(datos) {
  return {
    getPayload: () => ({ sub: '123', email: 'a@b.com', email_verified: true, ...datos }),
  };
}

describe('SCRUM-35: verificarTokenGoogle', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it('rechaza una credencial ausente sin llamar a Google', async () => {
    await expect(verificarTokenGoogle(undefined)).rejects.toBeInstanceOf(ErrorValidacion);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rechaza una credencial vacía sin llamar a Google', async () => {
    await expect(verificarTokenGoogle('   ')).rejects.toBeInstanceOf(ErrorValidacion);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rechaza una credencial que no es texto sin llamar a Google', async () => {
    await expect(verificarTokenGoogle(1234)).rejects.toBeInstanceOf(ErrorValidacion);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('convierte el rechazo de Google en ErrorNoAutenticado', async () => {
    verifyIdToken.mockRejectedValue(new Error('token inválido'));
    await expect(verificarTokenGoogle('abc')).rejects.toBeInstanceOf(ErrorNoAutenticado);
  });

  it('rechaza un correo que Google no ha verificado', async () => {
    verifyIdToken.mockResolvedValue(respuestaGoogle({ email_verified: false }));
    await expect(verificarTokenGoogle('credencial-valida')).rejects.toBeInstanceOf(ErrorNoAutenticado);
  });

  it('devuelve los datos del cliente y verifica contra el audience correcto', async () => {
    verifyIdToken.mockResolvedValue(
      respuestaGoogle({ sub: '123', email: 'ana@gmail.com', given_name: 'Ana', family_name: 'Mora' }),
    );

    const resultado = await verificarTokenGoogle('credencial-valida');

    expect(resultado).toEqual({
      idGoogle: '123',
      correo: 'ana@gmail.com',
      nombre: 'Ana',
      apellido: 'Mora',
    });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'credencial-valida',
      audience: 'id-cliente-prueba',
    });
  });

  it('usa un guion como apellido cuando Google no lo envía', async () => {
    verifyIdToken.mockResolvedValue(respuestaGoogle({ given_name: 'Ana' }));

    const resultado = await verificarTokenGoogle('credencial-valida');

    expect(resultado.apellido).toBe('-');
  });

  it('usa el nombre completo cuando Google no envía el nombre por separado', async () => {
    verifyIdToken.mockResolvedValue(respuestaGoogle({ name: 'Ana Mora' }));

    const resultado = await verificarTokenGoogle('credencial-valida');

    expect(resultado.nombre).toBe('Ana Mora');
  });
});
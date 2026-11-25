import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/servicios/servicioDevolucion.js', () => ({
  devolverCompra: vi.fn(),
}));

const { devolverCompra } = await import('../../src/servicios/servicioDevolucion.js');
const { devolver } = await import('../../src/controladores/controladorDevolucion.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('SCRUM-49 controladorDevolucion', () => {
  const usuario = { idCliente: 141 };

  it('responde con lo que devuelve el servicio, con el id de la compra como número', async () => {
    devolverCompra.mockResolvedValue({ idFactura: 6, monto: 1000, metodo: 'PayPal' });
    const res = { json: vi.fn() };
    const next = vi.fn();

    await devolver({ usuario, params: { idFactura: '6' } }, res, next);

    expect(devolverCompra).toHaveBeenCalledWith(usuario, 6);
    expect(res.json).toHaveBeenCalledWith({ idFactura: 6, monto: 1000, metodo: 'PayPal' });
    expect(next).not.toHaveBeenCalled();
  });

  it('pasa los errores al manejador central', async () => {
    const error = new Error('falla');
    devolverCompra.mockRejectedValue(error);
    const res = { json: vi.fn() };
    const next = vi.fn();

    await devolver({ usuario, params: { idFactura: '6' } }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});

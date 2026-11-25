import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('oracledb', () => ({
  default: { NUMBER: 'NUMBER', STRING: 'STRING', BIND_IN: 'BIND_IN', BIND_OUT: 'BIND_OUT' },
}));

const {
  ERRORES_DEVOLUCION,
  confirmarDevolucion,
  solicitarDevolucion,
} = await import('../../src/repositorios/repositorioDevolucion.js');

let conexion;

beforeEach(() => {
  conexion = { execute: vi.fn() };
});

describe('SCRUM-49 repositorioDevolucion: códigos de error', () => {
  it('coinciden con los RAISE_APPLICATION_ERROR de los procedimientos', () => {
    expect(ERRORES_DEVOLUCION).toEqual({
      compraNoExiste: 20020,
      compraYaCancelada: 20021,
      fueraDePlazo: 20022,
      sinPagoRegistrado: 20023,
      sinDevolucionPorConfirmar: 20024,
    });
  });
});

describe('SCRUM-49 repositorioDevolucion: solicitarDevolucion', () => {
  it('llama a PR_SOLICITAR_DEVOLUCION con la conexión de la transacción y devuelve los parámetros de salida', async () => {
    conexion.execute.mockResolvedValue({
      outBinds: { monto: 1000, idPago: '4LS21320XF3825229', metodo: 'PayPal' },
    });

    await expect(solicitarDevolucion(conexion, 6, 141)).resolves.toEqual({
      monto: 1000,
      idPago: '4LS21320XF3825229',
      metodo: 'PayPal',
    });

    expect(conexion.execute).toHaveBeenCalledTimes(1);
    const [sql, binds] = conexion.execute.mock.calls[0];
    expect(sql).toMatch(/BEGIN\s+PR_SOLICITAR_DEVOLUCION\(:idFactura, :idCliente, :monto, :idPago, :metodo\);\s+END;/);
    expect(binds).toEqual({
      idFactura: 6,
      idCliente: 141,
      monto: { dir: 'BIND_OUT', type: 'NUMBER' },
      idPago: { dir: 'BIND_OUT', type: 'STRING', maxSize: 100 },
      metodo: { dir: 'BIND_OUT', type: 'STRING', maxSize: 20 },
    });
  });

  it('deja pasar los errores del procedimiento (el servicio los traduce)', async () => {
    const error = Object.assign(new Error('ORA-20022: Solo puedes cancelar tu compra hasta 5 días antes de la función'), {
      errorNum: 20022,
    });
    conexion.execute.mockRejectedValue(error);

    await expect(solicitarDevolucion(conexion, 6, 141)).rejects.toBe(error);
  });
});

describe('SCRUM-49 repositorioDevolucion: confirmarDevolucion', () => {
  it('llama a PR_CONFIRMAR_DEVOLUCION con el id del reembolso', async () => {
    conexion.execute.mockResolvedValue({});

    await confirmarDevolucion(conexion, 6, '9XB12345AB678901C');

    const [sql, binds] = conexion.execute.mock.calls[0];
    expect(sql).toMatch(/BEGIN\s+PR_CONFIRMAR_DEVOLUCION\(:idFactura, :idReembolso\);\s+END;/);
    expect(binds).toEqual({
      idFactura: 6,
      idReembolso: { dir: 'BIND_IN', type: 'STRING', val: '9XB12345AB678901C' },
    });
  });

  it.each([null, undefined])('envía null si la pasarela no dio id de reembolso (%s)', async (idReembolso) => {
    conexion.execute.mockResolvedValue({});

    await confirmarDevolucion(conexion, 6, idReembolso);

    const [, binds] = conexion.execute.mock.calls[0];
    expect(binds.idReembolso).toEqual({ dir: 'BIND_IN', type: 'STRING', val: null });
  });
});

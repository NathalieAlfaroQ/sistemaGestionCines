import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/configuracion/baseDatos.js', () => ({
  ejecutarTransaccion: vi.fn(),
}));
vi.mock('../../src/repositorios/repositorioDevolucion.js', () => ({
  ERRORES_DEVOLUCION: {
    compraNoExiste: 20020,
    compraYaCancelada: 20021,
    fueraDePlazo: 20022,
    sinPagoRegistrado: 20023,
    sinDevolucionPorConfirmar: 20024,
  },
  solicitarDevolucion: vi.fn(),
  confirmarDevolucion: vi.fn(),
}));
vi.mock('../../src/servicios/pasarelaPago.js', () => ({
  reembolsar: vi.fn(),
}));
vi.mock('../../src/servicios/pasarelaPayPal.js', () => ({
  reembolsarCaptura: vi.fn(),
}));
vi.mock('../../src/servicios/servicioCompra.js', () => ({
  NOMBRE_METODO_TARJETA: 'Tarjeta',
  NOMBRE_METODO_PAYPAL: 'PayPal',
}));
vi.mock('../../src/servicios/servicioReserva.js', async () => {
  const { ErrorNoAutenticado } = await import('../../src/errores/ErrorNoAutenticado.js');
  return {
    // Igual que la real: sin idCliente válido no se puede devolver
    obtenerIdCliente: (usuario) => {
      if (!Number.isInteger(usuario?.idCliente) || usuario.idCliente <= 0) throw new ErrorNoAutenticado('Sesión no válida');
      return usuario.idCliente;
    },
  };
});

const { ejecutarTransaccion } = await import('../../src/configuracion/baseDatos.js');
const { solicitarDevolucion, confirmarDevolucion } = await import('../../src/repositorios/repositorioDevolucion.js');
const { reembolsar } = await import('../../src/servicios/pasarelaPago.js');
const { reembolsarCaptura } = await import('../../src/servicios/pasarelaPayPal.js');
const { ErrorConflicto } = await import('../../src/errores/ErrorConflicto.js');
const { ErrorNoAutenticado } = await import('../../src/errores/ErrorNoAutenticado.js');
const { ErrorNoEncontrado } = await import('../../src/errores/ErrorNoEncontrado.js');
const { ErrorPasarela } = await import('../../src/errores/ErrorPasarela.js');
const { ErrorValidacion } = await import('../../src/errores/ErrorValidacion.js');
const {
  MENSAJE_COMPRA_NO_EXISTE,
  MENSAJE_COMPRA_YA_CANCELADA,
  MENSAJE_ERROR_REEMBOLSO,
  MENSAJE_FUERA_DE_PLAZO,
  devolverCompra,
} = await import('../../src/servicios/servicioDevolucion.js');

const usuario = { idCliente: 141, tipoUsuario: 'CLIENTE' };
const conexion = { nombre: 'conexion de prueba' };

const solicitudTarjeta = { monto: 1250, idPago: 'cmwuigolj1avxka01dcv6q3ql', metodo: 'Tarjeta' };
const solicitudPayPal = { monto: 1000, idPago: '4LS21320XF3825229', metodo: 'PayPal' };

function errorOracle(numero, mensaje = 'error de la BD') {
  return Object.assign(new Error(`ORA-${numero}: ${mensaje}`), { errorNum: numero });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // Simula ejecutarTransaccion: corre las operaciones y propaga sus errores (rollback)
  ejecutarTransaccion.mockImplementation(async (operaciones) => operaciones(conexion));
  solicitarDevolucion.mockResolvedValue(solicitudTarjeta);
  confirmarDevolucion.mockResolvedValue();
  reembolsar.mockResolvedValue('reembolso-onvo-1');
  reembolsarCaptura.mockResolvedValue('reembolso-paypal-1');
});

describe('SCRUM-49 servicioDevolucion: devolverCompra', () => {
  it('con tarjeta: solicita, reembolsa en ONVO por el monto, confirma con el id del reembolso y responde', async () => {
    await expect(devolverCompra(usuario, 41)).resolves.toEqual({ idFactura: 41, monto: 1250, metodo: 'Tarjeta' });

    expect(solicitarDevolucion).toHaveBeenCalledWith(conexion, 41, 141);
    expect(reembolsar).toHaveBeenCalledWith('cmwuigolj1avxka01dcv6q3ql', 1250);
    expect(reembolsarCaptura).not.toHaveBeenCalled();
    expect(confirmarDevolucion).toHaveBeenCalledWith(conexion, 41, 'reembolso-onvo-1');
  });

  it('con PayPal: reembolsa la captura completa', async () => {
    solicitarDevolucion.mockResolvedValue(solicitudPayPal);

    await expect(devolverCompra(usuario, 6)).resolves.toEqual({ idFactura: 6, monto: 1000, metodo: 'PayPal' });

    expect(reembolsarCaptura).toHaveBeenCalledWith('4LS21320XF3825229');
    expect(reembolsar).not.toHaveBeenCalled();
    expect(confirmarDevolucion).toHaveBeenCalledWith(conexion, 6, 'reembolso-paypal-1');
  });

  it('el orden es solicitar, reembolsar, confirmar, todo dentro de la transacción', async () => {
    await devolverCompra(usuario, 41);

    const orden = [
      solicitarDevolucion.mock.invocationCallOrder[0],
      reembolsar.mock.invocationCallOrder[0],
      confirmarDevolucion.mock.invocationCallOrder[0],
    ];
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(ejecutarTransaccion).toHaveBeenCalledTimes(1);
  });

  it('una compra con monto 0 (100 % de descuento) no pasa por la pasarela', async () => {
    solicitarDevolucion.mockResolvedValue({ ...solicitudTarjeta, monto: 0 });

    await devolverCompra(usuario, 41);

    expect(reembolsar).not.toHaveBeenCalled();
    expect(confirmarDevolucion).toHaveBeenCalledWith(conexion, 41, null);
  });

  it('si la pasarela no da id de reembolso, confirma con null', async () => {
    reembolsar.mockResolvedValue(null);

    await devolverCompra(usuario, 41);

    expect(confirmarDevolucion).toHaveBeenCalledWith(conexion, 41, null);
  });

  it.each([
    ['la factura no existe o es de otro cliente', 20020, ErrorNoEncontrado, MENSAJE_COMPRA_NO_EXISTE],
    ['la compra ya fue cancelada', 20021, ErrorConflicto, MENSAJE_COMPRA_YA_CANCELADA],
    ['faltan menos de 5 días', 20022, ErrorConflicto, MENSAJE_FUERA_DE_PLAZO],
  ])('si %s, traduce el error y no reembolsa', async (_caso, numero, Tipo, mensaje) => {
    solicitarDevolucion.mockRejectedValue(errorOracle(numero));

    const promesa = devolverCompra(usuario, 41);
    await expect(promesa).rejects.toBeInstanceOf(Tipo);
    await expect(promesa).rejects.toThrow(mensaje);
    expect(reembolsar).not.toHaveBeenCalled();
    expect(confirmarDevolucion).not.toHaveBeenCalled();
  });

  it('deja pasar los demás errores de la BD (el manejador responde 500)', async () => {
    const error = errorOracle(20023, 'La compra no tiene un pago registrado');
    solicitarDevolucion.mockRejectedValue(error);

    await expect(devolverCompra(usuario, 41)).rejects.toBe(error);
    expect(reembolsar).not.toHaveBeenCalled();
  });

  it('si el reembolso falla: ROLLBACK, no confirma y responde con un mensaje de devolución (no de pago)', async () => {
    reembolsar.mockRejectedValue(new ErrorPasarela('No se pudo procesar el pago en este momento.', 'cmwuigolj1avxka01dcv6q3ql'));

    const promesa = devolverCompra(usuario, 41);
    await expect(promesa).rejects.toBeInstanceOf(ErrorPasarela);
    await expect(promesa).rejects.toThrow(MENSAJE_ERROR_REEMBOLSO);
    expect(confirmarDevolucion).not.toHaveBeenCalled();
    // No se sabe si la pasarela alcanzó a devolver: queda en el registro para revisarlo
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No se pudo reembolsar la factura 41'), expect.anything());
  });

  it('si ya se reembolsó pero falla el COMMIT, lo deja en el registro para revisarlo a mano', async () => {
    const errorCommit = new Error('ORA-03113: end-of-file on communication channel');
    ejecutarTransaccion.mockImplementation(async (operaciones) => {
      await operaciones(conexion);
      throw errorCommit;
    });

    await expect(devolverCompra(usuario, 41)).rejects.toBe(errorCommit);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('La factura 41 se reembolsó (reembolso reembolso-onvo-1)'),
      errorCommit
    );
  });

  it('un método de pago desconocido es un error interno y no se confirma', async () => {
    solicitarDevolucion.mockResolvedValue({ ...solicitudTarjeta, metodo: 'Efectivo' });

    await expect(devolverCompra(usuario, 41)).rejects.toThrow("No se sabe reembolsar el método de pago 'Efectivo'");
    expect(confirmarDevolucion).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN])('rechaza el id de compra %s sin abrir la transacción', async (idFactura) => {
    await expect(devolverCompra(usuario, idFactura)).rejects.toBeInstanceOf(ErrorValidacion);
    expect(ejecutarTransaccion).not.toHaveBeenCalled();
  });

  it('exige un cliente en la sesión', async () => {
    await expect(devolverCompra({ tipoUsuario: 'EMPLEADO' }, 41)).rejects.toBeInstanceOf(ErrorNoAutenticado);
    expect(ejecutarTransaccion).not.toHaveBeenCalled();
  });
});

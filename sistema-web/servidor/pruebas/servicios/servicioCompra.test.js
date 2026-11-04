import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/configuracion/baseDatos.js', () => ({
  ejecutarTransaccion: vi.fn(),
}));
vi.mock('../../src/repositorios/repositorioCompra.js', () => ({
  RESTRICCION_ASIENTO_VENDIDO: 'UQ_DETALLES_FACTURA_PROYECCION_ASIENTO',
  obtenerDatosCliente: vi.fn(),
  obtenerIdMetodoPago: vi.fn(),
  insertarFactura: vi.fn(),
  insertarDetallesBoletos: vi.fn(),
  registrarIntencionPago: vi.fn(),
  obtenerMetodoPagoCliente: vi.fn(),
  guardarMetodoPagoCliente: vi.fn(),
}));
vi.mock('../../src/servicios/servicioReserva.js', () => ({
  MENSAJE_ASIENTO_NO_DISPONIBLE: 'El asiento seleccionado ya no está disponible. Por favor, elige otro.',
  validarSeleccion: vi.fn(),
}));
vi.mock('../../src/servicios/pasarelaPago.js', () => ({
  cobrar: vi.fn(),
  reembolsar: vi.fn(),
  obtenerTarjeta: vi.fn(),
}));
vi.mock('../../src/servicios/pasarelaPayPal.js', () => ({
  MENSAJE_PAYPAL_NO_COMPLETADO: 'La transacción fue cancelada o no pudo completarse.',
  crearOrden: vi.fn(),
  consultarOrden: vi.fn(),
  capturarOrden: vi.fn(),
  reembolsarCaptura: vi.fn(),
  convertirADolares: vi.fn(),
}));
vi.mock('../../src/servicios/servicioComprobante.js', () => ({
  enviarComprobante: vi.fn(),
}));
vi.mock('../../src/utilidades/fechas.js', () => ({
  ahoraCostaRica: () => '2026-11-02 20:15:00',
}));

import {
  asignarBoletos,
  calcularHuella,
  comprarBoletos,
  completarPagoPayPal,
} from '../../src/servicios/servicioCompra.js';
import { ejecutarTransaccion } from '../../src/configuracion/baseDatos.js';
import {
  guardarMetodoPagoCliente,
  insertarDetallesBoletos,
  insertarFactura,
  obtenerDatosCliente,
  obtenerIdMetodoPago,
  obtenerMetodoPagoCliente,
  registrarIntencionPago,
} from '../../src/repositorios/repositorioCompra.js';
import { validarSeleccion } from '../../src/servicios/servicioReserva.js';
import { cobrar, obtenerTarjeta, reembolsar } from '../../src/servicios/pasarelaPago.js';
import {
  capturarOrden,
  consultarOrden,
  convertirADolares,
  reembolsarCaptura,
} from '../../src/servicios/pasarelaPayPal.js';
import { enviarComprobante } from '../../src/servicios/servicioComprobante.js';
import { ErrorConflicto } from '../../src/errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js';
import { ErrorPagoRechazado } from '../../src/errores/ErrorPagoRechazado.js';
import { ErrorPasarela } from '../../src/errores/ErrorPasarela.js';
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js';

const ID_PROYECCION = 7;
const ID_FACTURA = 15;
const ID_INTENCION = 'cmvyv4g1q0lc3k7017mehiy0h';
const ID_METODO_PAGO = 'cmvyv38ar0l1uk301e9jal5l8';
const ADULTO = 1;
const NINO = 2;

const usuarioCliente = { idCliente: 21, tipoUsuario: 'CLIENTE' };
const conexion = { nombre: 'conexion de prueba' };

const precios = new Map([
  [ADULTO, { monto: 3300, descuento: 0 }],
  [NINO, { monto: 2600, descuento: 0 }],
]);

const datosCompra = {
  idProyeccion: ID_PROYECCION,
  asientos: [101, 102, 103],
  boletos: [
    { idTipoBoleto: ADULTO, cantidad: 2 },
    { idTipoBoleto: NINO, cantidad: 1 },
  ],
  idMetodoPago: ID_METODO_PAGO,
};

function errorOracleDuplicado(restriccion) {
  return Object.assign(new Error(`ORA-00001: unique constraint (CINEAURORA.${restriccion}) violated`), {
    errorNum: 1,
  });
}

describe('SCRUM-94-95 servicioCompra', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    validarSeleccion.mockResolvedValue({
      asientos: [101, 102, 103],
      boletos: datosCompra.boletos,
      precios,
      total: 9200,
    });
    obtenerDatosCliente.mockResolvedValue(['Ana', 'Mora', 'ana@correo.com']);
    obtenerIdMetodoPago.mockResolvedValue(1);
    insertarFactura.mockResolvedValue(ID_FACTURA);
    cobrar.mockResolvedValue({ idIntencion: ID_INTENCION, referencia: '752605' });
    enviarComprobante.mockResolvedValue();
    obtenerTarjeta.mockResolvedValue({
      marca: 'Visa',
      ultimosDigitos: '4242',
      mesVencimiento: 3,
      anioVencimiento: 2030,
      titular: 'Ana Mora',
    });

    // Simula ejecutarTransaccion: corre las operaciones y propaga sus errores (rollback)
    ejecutarTransaccion.mockImplementation(async (operaciones) => operaciones(conexion));
  });

  describe('asignarBoletos', () => {
    it('reparte los tipos de boleto entre los asientos en orden, con su precio', () => {
      expect(asignarBoletos([101, 102, 103], datosCompra.boletos, precios)).toEqual([
        { idAsiento: 101, idTipoBoleto: ADULTO, monto: 3300, descuento: 0 },
        { idAsiento: 102, idTipoBoleto: ADULTO, monto: 3300, descuento: 0 },
        { idAsiento: 103, idTipoBoleto: NINO, monto: 2600, descuento: 0 },
      ]);
    });
  });

  describe('comprarBoletos', () => {
    it.each([undefined, '', 'abc', 'id con espacios y símbolos!!', 12345678901])(
      'rechaza el método de pago inválido %s sin cobrar',
      async (idMetodoPago) => {
        await expect(
          comprarBoletos(usuarioCliente, ID_PROYECCION, { ...datosCompra, idMetodoPago })
        ).rejects.toBeInstanceOf(ErrorValidacion);
        expect(cobrar).not.toHaveBeenCalled();
      }
    );

    it('guarda la factura y los detalles, cobra el total calculado en el servidor y registra el pago', async () => {
      const compra = await comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra);

      expect(insertarFactura).toHaveBeenCalledWith(conexion, {
        idCliente: 21,
        idMetodo: 1,
        monto: 9200,
        fecha: '2026-11-02 20:15:00',
      });
      expect(insertarDetallesBoletos).toHaveBeenCalledWith(conexion, ID_FACTURA, ID_PROYECCION, [
        { idAsiento: 101, idTipoBoleto: ADULTO, monto: 3300, descuento: 0 },
        { idAsiento: 102, idTipoBoleto: ADULTO, monto: 3300, descuento: 0 },
        { idAsiento: 103, idTipoBoleto: NINO, monto: 2600, descuento: 0 },
      ]);
      expect(cobrar).toHaveBeenCalledWith({
        monto: 9200,
        idMetodoPago: ID_METODO_PAGO,
        descripcion: `Cine Aurora - Factura ${ID_FACTURA}`,
      });
      expect(registrarIntencionPago).toHaveBeenCalledWith(conexion, ID_FACTURA, ID_INTENCION);

      expect(compra).toEqual({
        idFactura: ID_FACTURA,
        total: 9200,
        referencia: '752605',
        correoEnviado: true,
        metodoGuardado: false,
      });
      expect(guardarMetodoPagoCliente).not.toHaveBeenCalled();
      expect(enviarComprobante).toHaveBeenCalledWith(ID_FACTURA, { idCliente: 21, nombre: 'Ana', correo: 'ana@correo.com' });
    });

    it('no manda correo si la compra falla', async () => {
      cobrar.mockRejectedValue(new ErrorPagoRechazado('El pago no pudo ser procesado.'));

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBeInstanceOf(ErrorPagoRechazado);
      expect(enviarComprobante).not.toHaveBeenCalled();
    });

    it('cobra después de guardar los detalles (si el asiento ya se vendió, no se cobra)', async () => {
      await comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra);

      const ordenDetalles = insertarDetallesBoletos.mock.invocationCallOrder[0];
      const ordenCobro = cobrar.mock.invocationCallOrder[0];
      expect(ordenDetalles).toBeLessThan(ordenCobro);
    });

    it('traduce el UNIQUE de asiento vendido a ErrorConflicto, sin cobrar', async () => {
      insertarDetallesBoletos.mockRejectedValue(errorOracleDuplicado('UQ_DETALLES_FACTURA_PROYECCION_ASIENTO'));

      const promesa = comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra);
      await expect(promesa).rejects.toBeInstanceOf(ErrorConflicto);
      await expect(promesa).rejects.toThrow('El asiento seleccionado ya no está disponible. Por favor, elige otro.');
      expect(cobrar).not.toHaveBeenCalled();
      expect(reembolsar).not.toHaveBeenCalled();
    });

    it('no confunde otro UNIQUE con un asiento vendido', async () => {
      const errorOtraRestriccion = errorOracleDuplicado('PK_DETALLES_FACTURA');
      insertarDetallesBoletos.mockRejectedValue(errorOtraRestriccion);

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBe(errorOtraRestriccion);
    });

    it('propaga el rechazo de la tarjeta sin reembolsar (no hubo cobro)', async () => {
      cobrar.mockRejectedValue(new ErrorPagoRechazado('El pago no pudo ser procesado.'));

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBeInstanceOf(ErrorPagoRechazado);
      expect(registrarIntencionPago).not.toHaveBeenCalled();
      expect(reembolsar).not.toHaveBeenCalled();
    });

    it('reembolsa si la compra no se pudo guardar después de cobrar', async () => {
      const errorCommit = new Error('ORA-03113: end-of-file on communication channel');
      ejecutarTransaccion.mockImplementation(async (operaciones) => {
        await operaciones(conexion);
        throw errorCommit;
      });

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBe(errorCommit);
      expect(reembolsar).toHaveBeenCalledWith(ID_INTENCION, 9200);
    });

    it('pide el reembolso si no se sabe si ONVO cobró', async () => {
      cobrar.mockRejectedValue(new ErrorPasarela('Error de la pasarela', ID_INTENCION));

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBeInstanceOf(ErrorPasarela);
      expect(reembolsar).toHaveBeenCalledWith(ID_INTENCION, 9200);
    });

    it('no reembolsa si ONVO falló antes de crear la intención', async () => {
      cobrar.mockRejectedValue(new ErrorPasarela('Error de la pasarela'));

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBeInstanceOf(ErrorPasarela);
      expect(reembolsar).not.toHaveBeenCalled();
    });

    it('si el reembolso también falla, igual devuelve el error original', async () => {
      const errorCommit = new Error('fallo al confirmar');
      ejecutarTransaccion.mockImplementation(async (operaciones) => {
        await operaciones(conexion);
        throw errorCommit;
      });
      reembolsar.mockRejectedValue(new ErrorPasarela('Error de la pasarela', ID_INTENCION));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBe(errorCommit);
      expect(console.error).toHaveBeenCalled();
    });

    it('lanza ErrorNoEncontrado si el cliente del token ya no existe', async () => {
      obtenerDatosCliente.mockResolvedValue(null);

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toBeInstanceOf(ErrorNoEncontrado);
      expect(cobrar).not.toHaveBeenCalled();
    });

    it('falla sin cobrar si falta el método Tarjeta en METODOS_PAGO', async () => {
      obtenerIdMetodoPago.mockResolvedValue(null);

      await expect(comprarBoletos(usuarioCliente, ID_PROYECCION, datosCompra)).rejects.toThrow('METODOS_PAGO');
      expect(cobrar).not.toHaveBeenCalled();
    });
  });

  describe('tarjeta guardada', () => {
    const TOKEN_GUARDADO = 'tokenguardado0000000001';

    it('guarda la tarjeta con los datos que da ONVO si el cliente lo pidió', async () => {
      const compra = await comprarBoletos(usuarioCliente, ID_PROYECCION, { ...datosCompra, guardarMetodo: true });

      expect(obtenerTarjeta).toHaveBeenCalledWith(ID_METODO_PAGO);
      expect(guardarMetodoPagoCliente).toHaveBeenCalledWith({
        idCliente: 21,
        idMetodo: 1,
        token: ID_METODO_PAGO,
        marca: 'Visa',
        ultimosDigitos: '4242',
        vencimiento: '2030-03',
        titular: 'Ana Mora',
      });
      expect(compra.metodoGuardado).toBe(true);
    });

    it('cobra con el token guardado del cliente de la sesión, ignorando el idMetodoPago del cuerpo', async () => {
      obtenerMetodoPagoCliente.mockResolvedValue([TOKEN_GUARDADO, 'Visa', '4242', '2030-03', 'Ana Mora']);

      await comprarBoletos(usuarioCliente, ID_PROYECCION, {
        ...datosCompra,
        idMetodoPago: 'otrometodo000000000001',
        usarTarjetaGuardada: true,
      });

      expect(obtenerMetodoPagoCliente).toHaveBeenCalledWith(21);
      expect(cobrar).toHaveBeenCalledWith(expect.objectContaining({ idMetodoPago: TOKEN_GUARDADO }));
    });

    it('rechaza una tarjeta guardada vencida sin cobrar', async () => {
      obtenerMetodoPagoCliente.mockResolvedValue([TOKEN_GUARDADO, 'Visa', '4242', '2026-10', 'Ana Mora']);

      await expect(
        comprarBoletos(usuarioCliente, ID_PROYECCION, { ...datosCompra, usarTarjetaGuardada: true })
      ).rejects.toThrow('Tu tarjeta guardada está vencida. Usa otra tarjeta.');
      expect(cobrar).not.toHaveBeenCalled();
    });

  });

  describe('PayPal', () => {
    const ID_ORDEN = '7YJ07784CA3167202';
    const ID_CAPTURA = '2XM6716424273201D';
    const seleccion = { asientos: [101, 102, 103], boletos: datosCompra.boletos };
    const huella = () => calcularHuella(21, ID_PROYECCION, seleccion.asientos, seleccion.boletos);

    beforeEach(() => {
      convertirADolares.mockReturnValue('18.22');
      consultarOrden.mockImplementation(async () => ({
        estado: 'APPROVED',
        huella: huella(),
        moneda: 'USD',
        montoDolares: '18.22',
        captura: null,
      }));
      capturarOrden.mockResolvedValue({ idPago: ID_CAPTURA, referencia: ID_CAPTURA });
      obtenerIdMetodoPago.mockImplementation(async (nombre) => (nombre === 'PayPal' ? 2 : 1));
    });

    describe('calcularHuella', () => {
      it('no depende del orden en que llegan los asientos y los boletos', () => {
        const otraForma = calcularHuella(21, ID_PROYECCION, [103, 101, 102], [...datosCompra.boletos].reverse());
        expect(otraForma).toBe(huella());
      });

      it('cambia si cambia el cliente, la función, un asiento o un boleto', () => {
        const base = huella();
        expect(calcularHuella(22, ID_PROYECCION, seleccion.asientos, seleccion.boletos)).not.toBe(base);
        expect(calcularHuella(21, 8, seleccion.asientos, seleccion.boletos)).not.toBe(base);
        expect(calcularHuella(21, ID_PROYECCION, [101, 102, 104], seleccion.boletos)).not.toBe(base);
        expect(
          calcularHuella(21, ID_PROYECCION, seleccion.asientos, [{ idTipoBoleto: ADULTO, cantidad: 3 }])
        ).not.toBe(base);
      });
    });

    describe('completarPagoPayPal', () => {
      it('verifica la orden, guarda la compra como PayPal y captura', async () => {
        const compra = await completarPagoPayPal(usuarioCliente, ID_PROYECCION, ID_ORDEN, datosCompra);

        expect(consultarOrden).toHaveBeenCalledWith(ID_ORDEN);
        expect(insertarFactura).toHaveBeenCalledWith(conexion, expect.objectContaining({ idMetodo: 2, monto: 9200 }));
        expect(capturarOrden).toHaveBeenCalledWith(ID_ORDEN);
        expect(registrarIntencionPago).toHaveBeenCalledWith(conexion, ID_FACTURA, ID_CAPTURA);
        expect(compra).toEqual({ idFactura: ID_FACTURA, total: 9200, referencia: ID_CAPTURA, correoEnviado: true });
        expect(cobrar).not.toHaveBeenCalled();
      });

      it('no captura una orden cuya huella no corresponde a la selección', async () => {
        consultarOrden.mockResolvedValue({ estado: 'APPROVED', huella: 'huella-de-otra-seleccion', moneda: 'USD', montoDolares: '18.22' });

        await expect(completarPagoPayPal(usuarioCliente, ID_PROYECCION, ID_ORDEN, datosCompra)).rejects.toThrow(
          'La orden de PayPal no corresponde a esta compra'
        );
        expect(capturarOrden).not.toHaveBeenCalled();
      });

      it('reembolsa la captura si la compra no se pudo guardar después de capturar', async () => {
        const errorCommit = new Error('fallo al confirmar');
        ejecutarTransaccion.mockImplementation(async (operaciones) => {
          await operaciones(conexion);
          throw errorCommit;
        });

        await expect(completarPagoPayPal(usuarioCliente, ID_PROYECCION, ID_ORDEN, datosCompra)).rejects.toBe(errorCommit);
        expect(reembolsarCaptura).toHaveBeenCalledWith(ID_CAPTURA);
        expect(reembolsar).not.toHaveBeenCalled();
      });
    });
  });
});
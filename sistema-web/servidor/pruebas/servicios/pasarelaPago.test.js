import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/configuracion/onvo.js', () => ({
  configuracionOnvo: {
    llaveSecreta: 'onvo_test_secret_key_prueba',
    urlApi: 'https://api.onvopay.com/v1',
    tiempoEsperaMs: 15000,
  },
}));

import { cobrar, obtenerTarjeta, reembolsar } from '../../src/servicios/pasarelaPago.js';
import { ErrorPagoRechazado } from '../../src/errores/ErrorPagoRechazado.js';
import { ErrorPasarela } from '../../src/errores/ErrorPasarela.js';

const URL_API = 'https://api.onvopay.com/v1';
const ID_INTENCION = 'cmvyv4g1q0lc3k7017mehiy0h';
const ID_METODO = 'cmvyv38ar0l1uk301e9jal5l8';

// Respuestas resumidas de las que devolvió el sandbox de ONVO
const intencionCreada = { id: ID_INTENCION, amount: 3300, currency: 'CRC', status: 'requires_payment_method' };

const intencionAprobada = {
  id: ID_INTENCION,
  amount: 3300,
  receivedAmount: 3300,
  status: 'succeeded',
  // ONVO manda failureMessage aunque el pago se apruebe: no se debe usar para decidir
  charges: [{ status: 'succeeded', refNumber: '752605', failureMessage: 'Transaction declined due to test payment method used' }],
};

const intencionRechazada = {
  id: ID_INTENCION,
  amount: 3300,
  receivedAmount: 0,
  status: 'requires_payment_method',
  charges: [{ status: 'failed', refNumber: '', failureCode: 'declined' }],
  lastPaymentError: { type: 'processing_error', code: 'declined' },
};

function respuesta(estadoHttp, cuerpo) {
  return { ok: estadoHttp >= 200 && estadoHttp < 300, status: estadoHttp, json: async () => cuerpo };
}

function cuerpoDeLlamada(numero) {
  return JSON.parse(fetch.mock.calls[numero][1].body);
}

const datosCobro = { monto: 3300, idMetodoPago: ID_METODO, descripcion: 'Cine Aurora - Factura 15' };

describe('SCRUM-XX pasarelaPago (ONVO)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('cobrar', () => {
    it('crea la intención en colones con la llave secreta y la confirma con el método de pago', async () => {
      fetch.mockResolvedValueOnce(respuesta(201, intencionCreada)).mockResolvedValueOnce(respuesta(200, intencionAprobada));

      await cobrar(datosCobro);

      const [urlCrear, opcionesCrear] = fetch.mock.calls[0];
      expect(urlCrear).toBe(`${URL_API}/payment-intents`);
      expect(opcionesCrear.method).toBe('POST');
      expect(opcionesCrear.headers.Authorization).toBe('Bearer onvo_test_secret_key_prueba');
      expect(cuerpoDeLlamada(0)).toEqual({ amount: 3300, currency: 'CRC', description: 'Cine Aurora - Factura 15' });

      expect(fetch.mock.calls[1][0]).toBe(`${URL_API}/payment-intents/${ID_INTENCION}/confirm`);
      expect(cuerpoDeLlamada(1)).toEqual({ paymentMethodId: ID_METODO });
    });

    it('devuelve el id de la intención y la referencia del cobro si el pago se aprueba', async () => {
      fetch.mockResolvedValueOnce(respuesta(201, intencionCreada)).mockResolvedValueOnce(respuesta(200, intencionAprobada));

      await expect(cobrar(datosCobro)).resolves.toEqual({ idIntencion: ID_INTENCION, referencia: '752605' });
    });

    it('lanza ErrorPagoRechazado con el mensaje del criterio si la tarjeta se rechaza', async () => {
      fetch.mockResolvedValueOnce(respuesta(201, intencionCreada)).mockResolvedValueOnce(respuesta(200, intencionRechazada));

      const promesa = cobrar(datosCobro);
      await expect(promesa).rejects.toBeInstanceOf(ErrorPagoRechazado);
      // Texto exacto del criterio de aceptación
      await expect(promesa).rejects.toThrow(
        'El pago no pudo ser procesado. Verifica los datos de tu tarjeta o intenta con otro método de pago.'
      );
    });

    it('trata como rechazado un pago que pide autenticación 3DS (fuera del alcance)', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockResolvedValueOnce(respuesta(200, { ...intencionCreada, status: 'requires_action' }));

      await expect(cobrar(datosCobro)).rejects.toBeInstanceOf(ErrorPagoRechazado);
    });

    it('trata como rechazado un método de pago que ONVO no reconoce (4xx al confirmar)', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockResolvedValueOnce(respuesta(404, { code: 'payment_methods.not_found' }));

      await expect(cobrar(datosCobro)).rejects.toBeInstanceOf(ErrorPagoRechazado);
    });

    it('lanza ErrorPasarela si no se puede crear la intención, sin intentar confirmar', async () => {
      fetch.mockResolvedValueOnce(respuesta(401, { message: 'Unauthorized' }));

      await expect(cobrar(datosCobro)).rejects.toBeInstanceOf(ErrorPasarela);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('lanza ErrorPasarela si ONVO no responde al crear la intención', async () => {
      fetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(cobrar(datosCobro)).rejects.toBeInstanceOf(ErrorPasarela);
    });

    it('si se pierde la respuesta al confirmar, consulta la intención y respeta el cobro que sí se hizo', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockRejectedValueOnce(new DOMException('Tiempo agotado', 'TimeoutError'))
        .mockResolvedValueOnce(respuesta(200, intencionAprobada));

      await expect(cobrar(datosCobro)).resolves.toEqual({ idIntencion: ID_INTENCION, referencia: '752605' });
      expect(fetch.mock.calls[2][0]).toBe(`${URL_API}/payment-intents/${ID_INTENCION}`);
      expect(fetch.mock.calls[2][1].method).toBe('GET');
    });

    it('si ONVO falla al confirmar (5xx) y la consulta dice rechazado, lanza ErrorPagoRechazado', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockResolvedValueOnce(respuesta(500, null))
        .mockResolvedValueOnce(respuesta(200, intencionRechazada));

      await expect(cobrar(datosCobro)).rejects.toBeInstanceOf(ErrorPagoRechazado);
    });

    it('si no se puede saber si se cobró, lanza ErrorPasarela con el id de la intención', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'));

      const error = await cobrar(datosCobro).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorPasarela);
      expect(error.idIntencion).toBe(ID_INTENCION);
    });

    it('si ONVO falla al confirmar y también al consultar, lanza ErrorPasarela con el id', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockResolvedValueOnce(respuesta(500, null))
        .mockResolvedValueOnce(respuesta(503, null));

      const error = await cobrar(datosCobro).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorPasarela);
      expect(error.idIntencion).toBe(ID_INTENCION);
    });

    it('lanza ErrorPasarela con el id si el pago sigue procesándose', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(201, intencionCreada))
        .mockResolvedValueOnce(respuesta(200, { ...intencionCreada, status: 'processing' }));

      const error = await cobrar(datosCobro).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorPasarela);
      expect(error.idIntencion).toBe(ID_INTENCION);
    });
  });

  describe('reembolsar', () => {
    it('pide el reembolso total de la intención y devuelve el id del reembolso', async () => {
      fetch.mockResolvedValueOnce(respuesta(201, { id: 'reembolso1' }));

      await expect(reembolsar(ID_INTENCION, 3300)).resolves.toBe('reembolso1');
      expect(fetch.mock.calls[0][0]).toBe(`${URL_API}/refunds`);
      expect(cuerpoDeLlamada(0)).toEqual({ paymentIntentId: ID_INTENCION, amount: 3300 });
    });

    it('lanza ErrorPasarela con el id de la intención si el reembolso falla', async () => {
      fetch.mockResolvedValueOnce(respuesta(400, { message: 'Bad Request' }));

      const error = await reembolsar(ID_INTENCION, 3300).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorPasarela);
      expect(error.idIntencion).toBe(ID_INTENCION);
    });
  });

  describe('obtenerTarjeta', () => {
    it('devuelve los datos visibles de la tarjeta registrada en ONVO', async () => {
      fetch.mockResolvedValueOnce(
        respuesta(200, {
          id: ID_METODO,
          type: 'card',
          status: 'active',
          card: { holderName: 'Prueba Aurora', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2030 },
        })
      );

      await expect(obtenerTarjeta(ID_METODO)).resolves.toEqual({
        marca: 'Visa',
        ultimosDigitos: '4242',
        mesVencimiento: 12,
        anioVencimiento: 2030,
        titular: 'Prueba Aurora',
      });
      expect(fetch.mock.calls[0][0]).toBe(`${URL_API}/payment-methods/${ID_METODO}`);
      expect(fetch.mock.calls[0][1].method).toBe('GET');
    });

    it('lanza ErrorPasarela si el método no existe o no es una tarjeta', async () => {
      fetch.mockResolvedValueOnce(respuesta(404, { code: 'payment_methods.not_found' }));
      await expect(obtenerTarjeta(ID_METODO)).rejects.toBeInstanceOf(ErrorPasarela);

      fetch.mockResolvedValueOnce(respuesta(200, { id: ID_METODO, type: 'mobile_number', card: null }));
      await expect(obtenerTarjeta(ID_METODO)).rejects.toBeInstanceOf(ErrorPasarela);
    });
  });
});

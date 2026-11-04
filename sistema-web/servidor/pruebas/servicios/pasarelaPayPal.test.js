import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/configuracion/paypal.js', () => ({
  configuracionPayPal: {
    idCliente: 'id-cliente',
    secretoCliente: 'secreto',
    tipoCambioDolar: 505,
    urlApi: 'https://api-m.sandbox.paypal.com',
    tiempoEsperaMs: 15000,
  },
}));

import {
  MENSAJE_PAYPAL_NO_COMPLETADO,
  capturarOrden,
  consultarOrden,
  convertirADolares,
  crearOrden,
  olvidarToken,
  reembolsarCaptura,
} from '../../src/servicios/pasarelaPayPal.js';
import { ErrorPagoRechazado } from '../../src/errores/ErrorPagoRechazado.js';
import { ErrorPasarela } from '../../src/errores/ErrorPasarela.js';

const URL_API = 'https://api-m.sandbox.paypal.com';
const ID_ORDEN = '7YJ07784CA3167202';
const ID_CAPTURA = '2XM6716424273201D';

// Respuestas resumidas de las que devolvió el sandbox de PayPal
const respuestaToken = { access_token: 'token-de-acceso', token_type: 'Bearer', expires_in: 32400 };

const ordenAprobada = {
  id: ID_ORDEN,
  status: 'APPROVED',
  purchase_units: [{ custom_id: 'huella', amount: { currency_code: 'USD', value: '6.53' } }],
};

const ordenCapturada = {
  id: ID_ORDEN,
  status: 'COMPLETED',
  purchase_units: [{ payments: { captures: [{ id: ID_CAPTURA, status: 'COMPLETED', amount: { currency_code: 'USD', value: '6.53' } }] } }],
};

function respuesta(estadoHttp, cuerpo) {
  return { ok: estadoHttp >= 200 && estadoHttp < 300, status: estadoHttp, json: async () => cuerpo };
}

// Las llamadas a la API vienen después de la del token
function llamadaApi(numero) {
  const [url, opciones] = fetch.mock.calls[numero];
  return { url, opciones, cuerpo: opciones.body ? JSON.parse(opciones.body) : undefined };
}

describe('SCRUM-95 pasarelaPayPal', () => {
  beforeEach(() => {
    olvidarToken();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('convertirADolares', () => {
    it('convierte colones a dólares con el tipo de cambio, redondeado a centavos', () => {
      expect(convertirADolares(3300)).toBe('6.53');
      expect(convertirADolares(11800)).toBe('23.37');
      expect(convertirADolares(505)).toBe('1.00');
    });
  });

  describe('token de acceso', () => {
    it('pide el token con las credenciales en Basic y lo reutiliza en las siguientes llamadas', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(200, respuestaToken))
        .mockResolvedValueOnce(respuesta(200, ordenAprobada))
        .mockResolvedValueOnce(respuesta(200, ordenAprobada));

      await consultarOrden(ID_ORDEN);
      await consultarOrden(ID_ORDEN);

      const [urlToken, opcionesToken] = fetch.mock.calls[0];
      expect(urlToken).toBe(`${URL_API}/v1/oauth2/token`);
      expect(opcionesToken.headers.Authorization).toBe(`Basic ${Buffer.from('id-cliente:secreto').toString('base64')}`);
      expect(opcionesToken.body).toBe('grant_type=client_credentials');

      // Un solo token para las dos consultas
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(llamadaApi(1).opciones.headers.Authorization).toBe('Bearer token-de-acceso');
      expect(llamadaApi(2).opciones.headers.Authorization).toBe('Bearer token-de-acceso');
    });

    it('lanza ErrorPasarela si las credenciales no sirven', async () => {
      fetch.mockResolvedValueOnce(respuesta(401, { error: 'invalid_client' }));

      await expect(consultarOrden(ID_ORDEN)).rejects.toBeInstanceOf(ErrorPasarela);
    });
  });

  describe('crearOrden', () => {
    it('crea una orden en dólares con la huella, sin envío y con "Pagar ahora"', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(201, { id: ID_ORDEN }));

      await expect(crearOrden({ montoDolares: '6.53', huella: 'huella', descripcion: 'Cine Aurora - 1 boleto' })).resolves.toBe(
        ID_ORDEN
      );

      const { url, cuerpo } = llamadaApi(1);
      expect(url).toBe(`${URL_API}/v2/checkout/orders`);
      expect(cuerpo.intent).toBe('CAPTURE');
      expect(cuerpo.purchase_units).toEqual([
        { custom_id: 'huella', description: 'Cine Aurora - 1 boleto', amount: { currency_code: 'USD', value: '6.53' } },
      ]);
      expect(cuerpo.payment_source.paypal.experience_context).toMatchObject({
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      });
    });

    it('lanza ErrorPasarela si PayPal no crea la orden', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(500, null));

      await expect(crearOrden({ montoDolares: '6.53', huella: 'h', descripcion: 'd' })).rejects.toBeInstanceOf(ErrorPasarela);
    });
  });

  describe('consultarOrden', () => {
    it('devuelve el estado, la huella y el monto de la orden', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(200, ordenAprobada));

      await expect(consultarOrden(ID_ORDEN)).resolves.toEqual({
        estado: 'APPROVED',
        huella: 'huella',
        moneda: 'USD',
        montoDolares: '6.53',
        captura: null,
      });
      expect(llamadaApi(1).url).toBe(`${URL_API}/v2/checkout/orders/${ID_ORDEN}`);
    });

    it('una orden que no existe es un pago no completado', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(404, null));

      await expect(consultarOrden(ID_ORDEN)).rejects.toThrow(MENSAJE_PAYPAL_NO_COMPLETADO);
    });
  });

  describe('capturarOrden', () => {
    it('devuelve el id de la captura cuando se completa', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(201, ordenCapturada));

      await expect(capturarOrden(ID_ORDEN)).resolves.toEqual({ idPago: ID_CAPTURA, referencia: ID_CAPTURA });
      expect(llamadaApi(1).url).toBe(`${URL_API}/v2/checkout/orders/${ID_ORDEN}/capture`);
      expect(llamadaApi(1).opciones.method).toBe('POST');
    });

    it('si PayPal no deja capturar (fuente de pago rechazada), lanza el mensaje del criterio', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(200, respuestaToken))
        .mockResolvedValueOnce(respuesta(422, { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'INSTRUMENT_DECLINED' }] }));

      const promesa = capturarOrden(ID_ORDEN);
      await expect(promesa).rejects.toBeInstanceOf(ErrorPagoRechazado);
      await expect(promesa).rejects.toThrow('La transacción fue cancelada o no pudo completarse.');
    });

    it('si se pierde la respuesta, consulta la orden y respeta la captura que sí se hizo', async () => {
      fetch
        .mockResolvedValueOnce(respuesta(200, respuestaToken))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(respuesta(200, ordenCapturada));

      await expect(capturarOrden(ID_ORDEN)).resolves.toEqual({ idPago: ID_CAPTURA, referencia: ID_CAPTURA });
      expect(llamadaApi(2).opciones.method).toBe('GET');
    });

    it('si PayPal falla (5xx) y la orden no quedó capturada, lanza ErrorPasarela', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch
        .mockResolvedValueOnce(respuesta(200, respuestaToken))
        .mockResolvedValueOnce(respuesta(500, null))
        .mockResolvedValueOnce(respuesta(200, ordenAprobada));

      await expect(capturarOrden(ID_ORDEN)).rejects.toBeInstanceOf(ErrorPasarela);
    });

    it('una captura que no quedó completada no se da por pagada', async () => {
      const pendiente = structuredClone(ordenCapturada);
      pendiente.purchase_units[0].payments.captures[0].status = 'PENDING';
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(201, pendiente));

      await expect(capturarOrden(ID_ORDEN)).rejects.toBeInstanceOf(ErrorPasarela);
    });
  });

  describe('reembolsarCaptura', () => {
    it('pide el reembolso total de la captura', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(201, { id: 'reembolso1' }));

      await expect(reembolsarCaptura(ID_CAPTURA)).resolves.toBe('reembolso1');
      expect(llamadaApi(1).url).toBe(`${URL_API}/v2/payments/captures/${ID_CAPTURA}/refund`);
      expect(llamadaApi(1).cuerpo).toEqual({});
    });

    it('lanza ErrorPasarela con el id si el reembolso falla', async () => {
      fetch.mockResolvedValueOnce(respuesta(200, respuestaToken)).mockResolvedValueOnce(respuesta(422, null));

      const error = await reembolsarCaptura(ID_CAPTURA).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorPasarela);
      expect(error.idIntencion).toBe(ID_CAPTURA);
    });
  });
});

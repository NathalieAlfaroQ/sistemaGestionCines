import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(carpetaServidor, '.env') });

// Configuración de PayPal (sandbox). PayPal no acepta colones: se cobra en dólares con un tipo
// de cambio fijo, que alguien del equipo actualiza en el .env cuando haga falta.
function validarEntornoPayPal() {
  for (const variable of ['PAYPAL_ID_CLIENTE', 'PAYPAL_SECRETO_CLIENTE', 'TIPO_CAMBIO_DOLAR']) {
    if (!process.env[variable]) {
      throw new Error(`La variable de entorno ${variable} no está definida.`);
    }
  }

  const tipoCambio = Number(process.env.TIPO_CAMBIO_DOLAR);
  if (!Number.isFinite(tipoCambio) || tipoCambio <= 0) {
    throw new Error('La variable de entorno TIPO_CAMBIO_DOLAR debe ser un número mayor que 0.');
  }

  return {
    idCliente: process.env.PAYPAL_ID_CLIENTE,
    secretoCliente: process.env.PAYPAL_SECRETO_CLIENTE,
    tipoCambioDolar: tipoCambio,
    urlApi: 'https://api-m.sandbox.paypal.com',
    tiempoEsperaMs: 15000,
  };
}

export const configuracionPayPal = validarEntornoPayPal();

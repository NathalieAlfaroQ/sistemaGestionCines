import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(carpetaServidor, '.env') });

// Configuración de la pasarela de pago ONVO (https://docs.onvopay.com).
// Revisa al arrancar que la llave secreta exista.
function validarEntornoOnvo() {
  if (!process.env.ONVO_LLAVE_SECRETA) {
    throw new Error('La variable de entorno ONVO_LLAVE_SECRETA no está definida.');
  }
  return {
    llaveSecreta: process.env.ONVO_LLAVE_SECRETA,
    urlApi: 'https://api.onvopay.com/v1',
    tiempoEsperaMs: 15000,
  };
}

export const configuracionOnvo = validarEntornoOnvo();
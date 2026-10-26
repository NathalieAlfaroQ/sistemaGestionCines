import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';

const carpetaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(carpetaServidor, '.env') });

function validarEntornoGoogle() {
  if (!process.env.GOOGLE_ID_CLIENTE) {
    throw new Error('La variable de entorno GOOGLE_ID_CLIENTE no está definida.');
  }
  return {
    idCliente: process.env.GOOGLE_ID_CLIENTE,
  };
}

export const configuracionGoogle = validarEntornoGoogle();

export const clienteGoogle = new OAuth2Client(configuracionGoogle.idCliente);
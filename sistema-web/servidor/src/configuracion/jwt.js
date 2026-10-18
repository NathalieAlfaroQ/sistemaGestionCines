import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(carpetaServidor, '.env') });

// Revisar si existen las variables de entorno necesarias
function validarEntornoJwt() {
  if (!process.env.JWT_SECRETO) {
    throw new Error('La variable de entorno JWT_SECRETO no está definida.');
  }
  if (!process.env.JWT_EXPIRACION) {
    throw new Error('La variable de entorno JWT_EXPIRACION no está definida.');
  }
  return {
    secreto: process.env.JWT_SECRETO,
    expiracion: process.env.JWT_EXPIRACION,
  };
}

export const configuracionJwt = validarEntornoJwt();
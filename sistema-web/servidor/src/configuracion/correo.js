import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(carpetaServidor, '.env') });

// Configuración del servidor de correo (SMTP). Usa las mismas variables que ya tiene el equipo
// para el correo de la contraseña temporal.
const VARIABLES_REQUERIDAS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

function validarEntornoCorreo() {
  for (const variable of VARIABLES_REQUERIDAS) {
    if (!process.env[variable]) {
      throw new Error(`La variable de entorno ${variable} no está definida.`);
    }
  }

  const puerto = Number.parseInt(process.env.SMTP_PORT, 10);
  if (!Number.isInteger(puerto)) {
    throw new Error('La variable de entorno SMTP_PORT no es un número.');
  }

  return {
    servidor: process.env.SMTP_HOST,
    puerto,
    usuario: process.env.SMTP_USER,
    contrasena: process.env.SMTP_PASS,
    remitente: process.env.SMTP_FROM,
  };
}

export const configuracionCorreo = validarEntornoCorreo();

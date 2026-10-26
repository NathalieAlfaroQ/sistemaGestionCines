import { OAuth2Client } from 'google-auth-library';

export const idClienteGoogle = process.env.GOOGLE_ID_CLIENTE;

if (!idClienteGoogle) {
  throw new Error('Falta la variable GOOGLE_ID_CLIENTE en el .env');
}

export const clienteGoogle = new OAuth2Client(idClienteGoogle);
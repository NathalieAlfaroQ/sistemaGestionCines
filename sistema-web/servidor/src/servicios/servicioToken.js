import { configuracionJwt } from '../configuracion/jwt.js';
import jwt from 'jsonwebtoken';

export function generarToken(payload) {
  return jwt.sign(payload, configuracionJwt.secreto, { expiresIn: configuracionJwt.expiracion, algorithm: 'HS256' });
}

export function verificarToken(token) {
  return jwt.verify(token, configuracionJwt.secreto, { algorithms: ['HS256'] });
}
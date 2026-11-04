import { iniciarSesionConGoogle } from '../servicios/servicioAutenticacionGoogle.js';

export async function iniciarSesionGoogle(req, res, next) {
  try {
    const resultado = await iniciarSesionConGoogle(req.body?.credencial);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}
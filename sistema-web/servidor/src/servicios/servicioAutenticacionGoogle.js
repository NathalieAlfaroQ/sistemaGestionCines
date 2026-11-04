import { verificarTokenGoogle } from './servicioGoogle.js';
import { generarToken } from './servicioToken.js';
import { buscarPorIdGoogle, crearClienteConGoogle } from '../repositorios/repositorioGoogle.js';

const LIMITE_TEXTO = 50;
const CODIGO_ORACLE_DUPLICADO = 1;

export async function iniciarSesionConGoogle(credencial) {
  const datos = await verificarTokenGoogle(credencial);

  let cliente = await buscarPorIdGoogle(datos.idGoogle);

  if (!cliente) {
    const nombre = datos.nombre.slice(0, LIMITE_TEXTO);
    const apellido = datos.apellido.slice(0, LIMITE_TEXTO);
    try {
      const idCliente = await crearClienteConGoogle({ ...datos, nombre, apellido });
      cliente = [idCliente, nombre, apellido];
    } catch (error) {
      if (error.errorNum !== CODIGO_ORACLE_DUPLICADO) throw error;
      cliente = await buscarPorIdGoogle(datos.idGoogle);
    }
  }

  const [idCliente, nombre, apellido] = cliente;

  const token = generarToken({
    idCliente,
    tipoUsuario: 'CLIENTE',
    proveedor: 'GOOGLE',
  });

  return {
    mensaje: 'Inicio de sesión exitoso',
    token,
    usuario: { idCliente, correo: datos.correo, tipoUsuario: 'CLIENTE', nombre, apellido },
  };
}
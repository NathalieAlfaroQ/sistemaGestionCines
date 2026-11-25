import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';

function enviar(url, metodo, cuerpo, mensajePorDefecto) {
  return leerDatos(
    () => peticionApi(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }),
    mensajePorDefecto
  );
}

// cambios: { nombre } y/o { apellido }. Devuelve los valores ya guardados, sin espacios sobrantes
export function actualizarPerfil(cambios) {
  return enviar('/api/perfil', 'PUT', cambios, 'No se pudo guardar el cambio, reintente después');
}

// El endpoint de contraseña (cambiarContrasena.js) identifica la cuenta por el correo
export function cambiarContrasena(correo, contrasenaNueva) {
  return enviar('/api/cambiar-contrasena', 'POST', { correo, contrasenaNueva }, 'No se pudo cambiar la contraseña, reintente después');
}
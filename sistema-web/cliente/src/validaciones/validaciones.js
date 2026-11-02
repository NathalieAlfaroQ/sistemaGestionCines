export function validarNombreOApellido(valor) {  
  const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
  
  if (!regexLetras.test(valor)) {
    return 'X Solo se admiten letras';
  }

  return '';
}

export function validarCorreo(valor) {
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!regexCorreo.test(valor)) {
    return 'X Formato del correo nombre@ejemplo.com';
  }

  return '';
}

export const MENSAJES_ERROR = {
  CREDENCIALES: 'X Credenciales inválidas',
  SERVIDOR: 'Error al cargar la pantalla, intenta luego.',
};
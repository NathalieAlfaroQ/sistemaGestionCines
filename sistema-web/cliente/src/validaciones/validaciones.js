// Validar nombres y apellidos (solo letras, tildes y ñ)
export function validarNombreOApellido(valor) {
  if (!valor.trim()) return 'Espacio obligatorio';

  const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
  
  if (!regexLetras.test(valor)) {
    return 'Solo se admiten letras';
  }

  return '';
}

// Validar estructura del correo
export function validarCorreo(valor) {
  if (!valor.trim()) return 'Espacio obligatorio';

  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!regexCorreo.test(valor)) {
    return 'Formato del correo debe ser nombre@ejemplo.com';
  }

  return '';
}
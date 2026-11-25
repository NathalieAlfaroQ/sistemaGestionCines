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

export const validarContrasenaFuerte = (valor) => {  
  // Mínimo 12 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#*?\-$%_])[A-Za-z\d@#*?\-$%_]{12,}$/;
  
  if (!regex.test(valor)) {
    return 'Requisitos mínimos: 12 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@, #, *, ?, -, $, %, _)';
  }

  return '';
};

export const MENSAJES_ERROR = {
  CREDENCIALES: 'X Credenciales inválidas',
  SERVIDOR: 'Error al cargar la pantalla, intenta luego.',
  NO_COINCIDEN: 'Contraseñas no coinciden'
};

export function validarNombreProducto(valor) {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s]+$/; 
  if (!valor || valor.trim() === '') return 'X El nombre es obligatorio';
  if (!regex.test(valor)) return 'X Solo se admiten letras y números';
  if (valor.length > 20) return 'X Máximo 20 caracteres'; 
  return '';
}

export function validarPrecio(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero) || numero <= 0) return 'X El precio debe ser mayor a 0';
  if (numero > 99999999.99) return 'X Precio demasiado alto';
  return '';
}

export function validarCantidad(valor) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) return 'X La cantidad debe ser mayor o igual a 0';
  return '';
}
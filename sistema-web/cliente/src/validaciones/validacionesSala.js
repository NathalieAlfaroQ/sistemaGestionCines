export const MENSAJE_OBLIGATORIO = 'Este espacio es obligatorio';

export const NOMBRE_MAXIMO = 20;

const PATRON_NOMBRE = /^[\p{L}\d]+(?: [\p{L}\d]+)*$/u;

export function normalizarNombre(nombre) {
  return nombre.trim().replaceAll(/\s+/g, ' ');
}

function validarFormatoNombre(nombre) {
  return nombre !== '' && !PATRON_NOMBRE.test(nombre) ? 'Solo se admiten letras y números' : null;
}

function validarNombre(nombreSinNormalizar) {
  const nombre = normalizarNombre(nombreSinNormalizar);
  if (nombre === '') return MENSAJE_OBLIGATORIO;

  const errorFormato = validarFormatoNombre(nombre);
  if (errorFormato) return errorFormato;

  if (nombre.length > NOMBRE_MAXIMO) return `No puede superar los ${NOMBRE_MAXIMO} caracteres`;
  return null;
}

const reglas = {
  nombre: ({ formulario }) => validarNombre(formulario.nombre),
  idSede: ({ formulario }) => (formulario.idSede === '' ? MENSAJE_OBLIGATORIO : null),
  idTipo: ({ formulario }) => (formulario.idTipo === '' ? MENSAJE_OBLIGATORIO : null),
  idFormato: ({ formulario }) => (formulario.idFormato === '' ? MENSAJE_OBLIGATORIO : null),
  idDistribucion: ({ formulario }) => (formulario.idDistribucion === '' ? MENSAJE_OBLIGATORIO : null),
};

export function validarTodo(datos) {
  const errores = {};
  for (const [campo, regla] of Object.entries(reglas)) {
    const mensaje = regla(datos);
    if (mensaje !== null) errores[campo] = mensaje;
  }
  return errores;
}

export function validarEnVivo({ formulario }) {
  const errorFormato = validarFormatoNombre(normalizarNombre(formulario.nombre));
  return errorFormato ? { nombre: errorFormato } : {};
}

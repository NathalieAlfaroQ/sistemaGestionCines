export const MENSAJE_OBLIGATORIO = 'Este espacio es obligatorio';

export const NOMBRE_MINIMO = 10;
export const NOMBRE_MAXIMO = 30;

const PATRON_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

export function normalizarNombre(nombre) {
  return nombre.trim().replace(/\s+/g, ' ');
}

function validarFormatoNombre(nombre) {
  return nombre !== '' && !PATRON_NOMBRE.test(nombre) ? 'Solo se admiten letras' : null;
}

function validarNombre(nombreSinNormalizar) {
  const nombre = normalizarNombre(nombreSinNormalizar);
  if (nombre === '') return MENSAJE_OBLIGATORIO;

  const errorFormato = validarFormatoNombre(nombre);
  if (errorFormato) return errorFormato;

  if (nombre.length < NOMBRE_MINIMO) return `Debe tener al menos ${NOMBRE_MINIMO} caracteres`;
  if (nombre.length > NOMBRE_MAXIMO) return `No puede superar los ${NOMBRE_MAXIMO} caracteres`;
  return null;
}

const reglas = {
  nombre: ({ formulario }) => validarNombre(formulario.nombre),
  idProvincia: ({ formulario }) => (formulario.idProvincia === '' ? MENSAJE_OBLIGATORIO : null),
  idCanton: ({ formulario }) => (formulario.idCanton === '' ? MENSAJE_OBLIGATORIO : null),
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

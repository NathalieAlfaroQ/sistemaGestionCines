import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';

export const MENSAJE_OBLIGATORIO = 'Este espacio es obligatorio';

// Letras (con tildes y ñ), números, espacios, puntuación y símbolos de operación o moneda
const PATRON_TITULO = /^[\p{L}\p{N}\p{P}\p{Sm}\p{Sc} ]+$/u;
// De 1 a 3 dígitos (formato 000)
const PATRON_DURACION = /^\d{1,3}$/;

function validarTitulo(titulo) {
  const texto = titulo.trim();
  if (texto === '') return MENSAJE_OBLIGATORIO;
  if (!PATRON_TITULO.test(texto)) return 'El título solo admite letras, números, espacios y signos';
  return null;
}

function validarDuracion(duracion) {
  if (duracion === '') return MENSAJE_OBLIGATORIO;
  if (!PATRON_DURACION.test(duracion) || Number(duracion) < 1) {
    return 'Ingrese la duración en minutos, de 1 a 999';
  }
  return null;
}

// Una regla por campo. Cada una recibe todos los datos y devuelve un mensaje o null
const reglasFormulario = {
  titulo: ({ formulario }) => validarTitulo(formulario.titulo),
  duracion: ({ formulario }) => validarDuracion(formulario.duracion),
  clasificacion: ({ formulario }) => (formulario.clasificacion === '' ? MENSAJE_OBLIGATORIO : null),
  generos: ({ formulario }) => (formulario.generos.length === 0 ? MENSAJE_OBLIGATORIO : null),
};

// Una regla por cada tipo de imagen marcado como obligatorio en TIPOS_IMAGEN
const reglasImagenes = Object.fromEntries(
  TIPOS_IMAGEN.filter(({ obligatoria }) => obligatoria).map(({ tipo }) => [
    tipo,
    ({ imagenes }) => (imagenes[tipo] ? null : MENSAJE_OBLIGATORIO),
  ])
);

const reglas = { ...reglasFormulario, ...reglasImagenes };

// Devuelve { campo: mensaje } solo con los campos que tienen error
export function validarTodo(datos) {
  const errores = {};
  for (const [campo, regla] of Object.entries(reglas)) {
    const mensaje = regla(datos);
    if (mensaje !== null) errores[campo] = mensaje;
  }
  return errores;
}
import { MENSAJE_OBLIGATORIO, fechaATexto, horaATexto } from './validacionesProyeccion.js';

export const NOMBRE_MAXIMO = 50;

// Los descuentos pueden empezar o terminar a cualquier hora del día, cada 5 minutos
export const HORAS_DESCUENTO = Array.from({ length: 24 }, (_, indice) => String(indice).padStart(2, '0'));

const MENSAJE_PORCENTAJE = 'El porcentaje debe ser mayor que 0 y no mayor que 100, con máximo dos decimales';
const MENSAJE_FIN = 'La fecha y hora de fin debe ser posterior a la de inicio';

// Hasta tres dígitos enteros y dos decimales; acepta coma o punto
const PATRON_PORCENTAJE = /^\d{1,3}([.,]\d{1,2})?$/;

export const porcentajeANumero = (texto) => Number(texto.trim().replace(',', '.'));

function validarPorcentaje(texto) {
  const limpio = texto.trim();
  if (limpio === '') return MENSAJE_OBLIGATORIO;
  if (!PATRON_PORCENTAJE.test(limpio)) return MENSAJE_PORCENTAJE;

  const porcentaje = porcentajeANumero(limpio);
  return porcentaje > 0 && porcentaje <= 100 ? null : MENSAJE_PORCENTAJE;
}

const momentoCompleto = (fecha, hora, minuto) => fecha !== null && hora !== '' && minuto !== '';

function validarMomento(fecha, hora, minuto) {
  return momentoCompleto(fecha, hora, minuto) ? null : MENSAJE_OBLIGATORIO;
}

// 'AAAA-MM-DD HH:MM' se puede comparar como texto
function momentoATexto(fecha, hora, minuto) {
  return `${fechaATexto(fecha)} ${horaATexto({ hora, minuto })}`;
}

function finNoPosterior({ fechaInicio, horaInicio, minutoInicio, fechaFin, horaFin, minutoFin }) {
  if (!momentoCompleto(fechaInicio, horaInicio, minutoInicio) || !momentoCompleto(fechaFin, horaFin, minutoFin)) {
    return false;
  }
  return momentoATexto(fechaFin, horaFin, minutoFin) <= momentoATexto(fechaInicio, horaInicio, minutoInicio);
}

function validarFin(formulario) {
  const { fechaFin, horaFin, minutoFin } = formulario;
  if (!momentoCompleto(fechaFin, horaFin, minutoFin)) return MENSAJE_OBLIGATORIO;
  return finNoPosterior(formulario) ? MENSAJE_FIN : null;
}

const reglas = {
  nombre: ({ formulario }) => (formulario.nombre.trim() === '' ? MENSAJE_OBLIGATORIO : null),
  porcentaje: ({ formulario }) => validarPorcentaje(formulario.porcentaje),
  idSede: ({ formulario }) => (formulario.idSede === '' ? MENSAJE_OBLIGATORIO : null),
  idsPeliculas: ({ formulario }) =>
    !formulario.aplicaTodas && formulario.idsPeliculas.length === 0 ? 'Seleccione al menos una película o la opción Todas' : null,
  inicio: ({ formulario }) => validarMomento(formulario.fechaInicio, formulario.horaInicio, formulario.minutoInicio),
  fin: ({ formulario }) => validarFin(formulario),
};

export function validarTodo(datos) {
  const errores = {};
  for (const [campo, regla] of Object.entries(reglas)) {
    const mensaje = regla(datos);
    if (mensaje !== null) errores[campo] = mensaje;
  }
  return errores;
}

// Avisa de inmediato si el fin queda antes del inicio
export function validarEnVivo({ formulario }) {
  return finNoPosterior(formulario) ? { fin: MENSAJE_FIN } : {};
}

export { momentoATexto };
export const MENSAJE_OBLIGATORIO = 'Este espacio es obligatorio';
const MENSAJE_HORA_PASADA = 'La proyección debe ser posterior a la fecha y hora actuales';

const HORA_PRIMERA = 6;
const HORA_ULTIMA = 22;
export const HORAS = Array.from({ length: HORA_ULTIMA - HORA_PRIMERA + 1 }, (_, indice) =>
  String(HORA_PRIMERA + indice).padStart(2, '0'),
);
// Las proyecciones se programan cada 5 minutos
export const MINUTOS = Array.from({ length: 12 }, (_, indice) => String(indice * 5).padStart(2, '0'));

export const MINUTOS_TAREA_MAXIMO = 99999;
const MENSAJE_MINUTOS_TAREA = `Los minutos deben estar entre 1 y ${MINUTOS_TAREA_MAXIMO}`;

// 'sv-SE' formatea como 'AAAA-MM-DD HH:MM', en la hora del cine (Costa Rica)
const formateadorCostaRica = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Costa_Rica',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Fecha elegida en el calendario como AAAA-MM-DD, sin pasar por UTC
export function fechaATexto(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function horaATexto({ hora, minuto }) {
  return `${hora}:${minuto}`;
}

// Primer día que se puede elegir en el calendario: hoy, en Costa Rica
export function hoyParaCalendario() {
  const [anio, mes, dia] = formateadorCostaRica.format(new Date()).slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function horaYaPaso({ fecha, hora, minuto }) {
  if (!fecha || hora === '' || minuto === '') return false;
  return `${fechaATexto(fecha)} ${horaATexto({ hora, minuto })}` <= formateadorCostaRica.format(new Date());
}

function validarHora(formulario) {
  if (formulario.hora === '' || formulario.minuto === '') return MENSAJE_OBLIGATORIO;
  return horaYaPaso(formulario) ? MENSAJE_HORA_PASADA : null;
}

function validarTareas(tareas) {
  if (tareas.some((tarea) => tarea.idTarea === '' || tarea.minutos === '')) return MENSAJE_OBLIGATORIO;

  const minutosInvalidos = tareas.some((tarea) => {
    const minutos = Number(tarea.minutos);
    return !Number.isInteger(minutos) || minutos < 1 || minutos > MINUTOS_TAREA_MAXIMO;
  });
  return minutosInvalidos ? MENSAJE_MINUTOS_TAREA : null;
}

// Suma de los minutos de las tareas que ya tienen minutos válidos
export function minutosDeTareas(tareas) {
  return tareas.reduce((total, tarea) => total + (Number.parseInt(tarea.minutos, 10) || 0), 0);
}

const reglas = {
  idPelicula: ({ formulario }) => (formulario.idPelicula === '' ? MENSAJE_OBLIGATORIO : null),
  idSede: ({ formulario }) => (formulario.idSede === '' ? MENSAJE_OBLIGATORIO : null),
  idSala: ({ formulario }) => (formulario.idSala === '' ? MENSAJE_OBLIGATORIO : null),
  fecha: ({ formulario }) => (formulario.fecha === null ? MENSAJE_OBLIGATORIO : null),
  hora: ({ formulario }) => validarHora(formulario),
  tareas: ({ formulario }) => validarTareas(formulario.tareas),
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
  return horaYaPaso(formulario) ? { hora: MENSAJE_HORA_PASADA } : {};
}

// Convierte AAAA-MM-DD (como llega de la API) a la fecha local que usa el calendario
export function textoAFecha(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export const MENSAJE_OBLIGATORIO = 'Este espacio es obligatorio';
const MENSAJE_HORA_PASADA = 'La proyección debe ser posterior a la fecha y hora actuales';

export const HORAS = Array.from({ length: 24 }, (_, hora) => String(hora).padStart(2, '0'));
// Las proyecciones se programan cada 5 minutos
export const MINUTOS = Array.from({ length: 12 }, (_, indice) => String(indice * 5).padStart(2, '0'));

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

const reglas = {
  idPelicula: ({ formulario }) => (formulario.idPelicula === '' ? MENSAJE_OBLIGATORIO : null),
  idSede: ({ formulario }) => (formulario.idSede === '' ? MENSAJE_OBLIGATORIO : null),
  idSala: ({ formulario }) => (formulario.idSala === '' ? MENSAJE_OBLIGATORIO : null),
  fecha: ({ formulario }) => (formulario.fecha === null ? MENSAJE_OBLIGATORIO : null),
  hora: ({ formulario }) => validarHora(formulario),
};

export function validarTodo(datos) {
  const errores = {};
  for (const [campo, regla] of Object.entries(reglas)) {
    const mensaje = regla(datos);
    if (mensaje !== null) errores[campo] = mensaje;
  }
  return errores;
}

// Se avisa de inmediato cuando la fecha y hora elegidas ya pasaron
export function validarEnVivo({ formulario }) {
  return horaYaPaso(formulario) ? { hora: MENSAJE_HORA_PASADA } : {};
}

// Fechas y horas para la compra de boletos, siempre en hora de Costa Rica
// (la del cine, no la de la computadora del usuario).

const ZONA_HORARIA = 'America/Costa_Rica';

// 'sv-SE' formatea como AAAA-MM-DD, el formato que espera la API
const formateadorDia = new Intl.DateTimeFormat('sv-SE', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formateadorDiaSemana = new Intl.DateTimeFormat('es-CR', { timeZone: 'UTC', weekday: 'long' });
const formateadorMes = new Intl.DateTimeFormat('es-CR', { timeZone: 'UTC', month: 'short' });

export function hoyCostaRica() {
  return formateadorDia.format(new Date());
}

function sumarDias(fecha, dias) {
  const resultado = new Date(`${fecha}T12:00:00Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function generarDias(cantidad) {
  const hoy = hoyCostaRica();

  return Array.from({ length: cantidad }, (_, indice) => {
    const fecha = sumarDias(hoy, indice);
    const valor = fecha.toISOString().slice(0, 10);

    if (indice === 0) return { valor, etiqueta: 'Hoy', dia: null, mes: null };
    if (indice === 1) return { valor, etiqueta: 'Mañana', dia: null, mes: null };

    return {
      valor,
      etiqueta: capitalizar(formateadorDiaSemana.format(fecha)),
      dia: fecha.getUTCDate(),
      mes: formateadorMes.format(fecha).replace('.', '').toUpperCase(),
    };
  });
}

const formateadorFechaFuncion = new Intl.DateTimeFormat('es-CR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function formatearFechaFuncion(fechaHora) {
  const [fecha, hora] = fechaHora.split(' ');
  const dia = formateadorFechaFuncion.format(new Date(`${fecha}T12:00:00Z`)).replace(',', '');
  return `${capitalizar(dia)}, ${formatearHora(hora)}`;
}

export function formatearHora(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  const sufijo = horas >= 12 ? 'PM' : 'AM';
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${horas12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
}
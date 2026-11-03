// Fechas y horas en hora de Costa Rica, como texto 'AAAA-MM-DD HH:MM:SS'.
// La BD corre en UTC y las columnas DATE no guardan zona horaria, así que el servidor
// calcula "ahora" en hora local y se lo pasa a Oracle como texto (no se usa SYSDATE).

// 'sv-SE' formatea como 'AAAA-MM-DD HH:MM:SS', el formato que esperan los repositorios
const formateadorCostaRica = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Costa_Rica',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function ahoraCostaRica() {
  return formateadorCostaRica.format(new Date());
}

// Formatos para mostrar fechas en el comprobante (correo y PDF).
// Reciben 'AAAA-MM-DD HH:MI' tal como sale de Oracle con TO_CHAR; usan UTC solo para no
// mover la fecha, porque el texto ya está en hora de Costa Rica.
const formateadorDia = new Intl.DateTimeFormat('es-CR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatearHora(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  const sufijo = horas >= 12 ? 'PM' : 'AM';
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${horas12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
}

// '2026-11-02 20:15' -> 'Lunes, 2 de noviembre de 2026, 8:15 PM'
export function formatearFechaHora(fechaHora) {
  const [fecha, hora] = fechaHora.split(' ');
  const dia = formateadorDia.format(new Date(`${fecha}T12:00:00Z`));
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${formatearHora(hora)}`;
}

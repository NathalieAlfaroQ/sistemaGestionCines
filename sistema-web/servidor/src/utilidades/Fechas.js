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
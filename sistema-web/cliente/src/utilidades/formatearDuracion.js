// Duración en minutos como texto: 45 -> "45 min", 120 -> "2 h", 155 -> "2 h 35 min"
export function formatearDuracion(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

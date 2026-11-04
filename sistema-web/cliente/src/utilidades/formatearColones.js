// Sin decimales si el precio es entero (₡3 000); con dos si no lo es (₡3 000,50)
export function formatearColones(monto) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: Number.isInteger(monto) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(monto);
}

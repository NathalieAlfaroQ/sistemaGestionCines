// Posición de cada dato en las filas que devuelve GET /api/historial-compras
export const POS_COMPRA = {
  id: 0,
  titulo: 1,
  urlPoster: 2,
  fechaFuncion: 3,
  fechaCompra: 4,
  estado: 5, // ESTADOS_COMPRA
  puedeCancelar: 6, // 1 si está activa y faltan 5 días o más para la función; 0 si no
  monto: 7, // lo que se pagó (y lo que se devuelve al cancelar)
};

export const ESTADOS_COMPRA = {
  activa: 'ACTIVA',
  cancelada: 'CANCELADA',
};

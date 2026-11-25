import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';
import { pedir } from './servicioReserva.js';

export async function obtenerHistorialCompras() {
  return await leerDatos(
    () => peticionApi('/api/historial-compras'),
    'No se pudo cargar el historial de compras, reintente después'
  );
}

// Cancela la compra completa y devuelve el dinero por el mismo medio con que se pagó.
// Devuelve { idFactura, monto, metodo, correoEnviado }. Si falla, lanza un error con el mensaje
// del servidor y su tipo (TIPOS_ERROR.conflicto si ya estaba cancelada o está fuera de plazo).
export async function cancelarCompra(idFactura) {
  return await pedir(
    `/api/compras/${encodeURIComponent(idFactura)}/devolucion`,
    { method: 'POST' },
    'No se pudo cancelar la compra. Intenta de nuevo más tarde.'
  );
}

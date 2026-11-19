import { peticionApi } from './clienteApi.js';
import { leerDatos } from './leerDatos.js';

export async function obtenerHistorialCompras() {
  return await leerDatos(
    () => peticionApi('/api/historial-compras'),
    'No se pudo cargar el historial de compras, reintente después'
  );
}
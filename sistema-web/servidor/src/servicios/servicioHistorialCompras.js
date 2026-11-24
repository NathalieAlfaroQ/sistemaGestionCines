import { ErrorNoAutenticado } from '../errores/ErrorNoAutenticado.js';
import { listarHistorialCompras } from '../repositorios/repositorioHistorialCompras.js';
import { obtenerUrlImagen } from './almacenamientoImagenes.js';

const POS_CLAVE_POSTER = 2;

// Devuelve las compras del cliente de la sesión, con la clave del póster convertida en URL.
// Los tokens emitidos antes de agregar idCliente (y los del personal) no tienen compras que mostrar.
export async function consultarHistorialCompras(usuario) {
  const idCliente = usuario?.idCliente;
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ErrorNoAutenticado('Tu sesión no es válida. Inicia sesión de nuevo.');
  }

  const filas = await listarHistorialCompras(idCliente);

  return filas.map((fila) => fila.map((valor, posicion) => (posicion === POS_CLAVE_POSTER ? obtenerUrlImagen(valor) : valor)));
}
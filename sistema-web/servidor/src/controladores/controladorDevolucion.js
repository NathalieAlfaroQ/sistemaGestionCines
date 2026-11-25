import { devolverCompra } from '../servicios/servicioDevolucion.js';

// Botón "Cancelar compra" del historial: devuelve la compra completa
export async function devolver(req, res, next) {
  try {
    res.json(await devolverCompra(req.usuario, Number(req.params.idFactura)));
  } catch (error) {
    next(error);
  }
}

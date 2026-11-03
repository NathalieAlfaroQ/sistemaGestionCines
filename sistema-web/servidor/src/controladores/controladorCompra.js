import { comprarBoletos, consultarMetodoPagoGuardado } from '../servicios/servicioCompra.js';
import { generarPdfBoletos } from '../servicios/servicioComprobante.js';

export async function comprar(req, res, next) {
  try {
    const compra = await comprarBoletos(req.usuario, Number(req.body?.idProyeccion), req.body);
    res.status(201).json(compra);
  } catch (error) {
    next(error);
  }
}

// Tarjeta guardada del cliente; { metodoPago: null } si no tiene ninguna
export async function verMetodoPagoGuardado(req, res, next) {
  try {
    res.json({ metodoPago: await consultarMetodoPagoGuardado(req.usuario) });
  } catch (error) {
    next(error);
  }
}

// Descarga del PDF de boletos (botón "Descargar boletos" si el correo no se pudo enviar)
export async function descargarBoletos(req, res, next) {
  try {
    const { nombreArchivo, pdf } = await generarPdfBoletos(Number(req.params.idFactura), req.usuario?.idCliente);
    res.type('application/pdf').attachment(nombreArchivo).send(pdf);
  } catch (error) {
    next(error);
  }
}
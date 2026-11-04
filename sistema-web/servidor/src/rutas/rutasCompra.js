import { Router } from 'express';
import {
  capturarOrdenPayPal,
  comprar,
  crearOrdenPayPal,
  descargarBoletos,
  verMetodoPagoGuardado,
} from '../controladores/controladorCompra.js';

// La autenticación y el rol CLIENTE se exigen en index.js para todo /api/compras
const enrutador = Router();

enrutador.post('/', comprar);
enrutador.post('/paypal/ordenes', crearOrdenPayPal);
enrutador.post('/paypal/ordenes/:idOrden/captura', capturarOrdenPayPal);
enrutador.get('/metodo-pago', verMetodoPagoGuardado);
enrutador.get('/:idFactura/boletos', descargarBoletos);

export default enrutador;

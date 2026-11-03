import { Router } from 'express';
import { comprar, descargarBoletos, verMetodoPagoGuardado } from '../controladores/controladorCompra.js';

// La autenticación y el rol CLIENTE se exigen en index.js para todo /api/compras
const enrutador = Router();

enrutador.post('/', comprar);
enrutador.get('/metodo-pago', verMetodoPagoGuardado);
enrutador.get('/:idFactura/boletos', descargarBoletos);

export default enrutador;
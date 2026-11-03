import { Router } from 'express';
import { comprar, descargarBoletos } from '../controladores/controladorCompra.js';

// La autenticación y el rol CLIENTE se exigen en index.js para todo /api/compras
const enrutador = Router();

enrutador.post('/', comprar);
enrutador.get('/:idFactura/boletos', descargarBoletos);

export default enrutador;

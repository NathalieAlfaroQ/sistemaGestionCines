import { Router } from 'express';
import { crearDescuento, listarDescuentos } from '../controladores/controladorDescuento.js';

const enrutador = Router();

enrutador.get('/', listarDescuentos);
enrutador.post('/', crearDescuento);

export default enrutador;
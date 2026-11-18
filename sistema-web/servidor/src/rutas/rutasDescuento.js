import { Router } from 'express';
import { crearDescuento, eliminarDescuento, listarDescuentos } from '../controladores/controladorDescuento.js';

const enrutador = Router();

enrutador.get('/', listarDescuentos);
enrutador.post('/', crearDescuento);
enrutador.delete('/:id', eliminarDescuento);

export default enrutador;
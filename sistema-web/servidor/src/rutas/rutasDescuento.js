import { Router } from 'express';
import { crearDescuento, editarDescuento, eliminarDescuento, listarDescuentos } from '../controladores/controladorDescuento.js';

const enrutador = Router();

enrutador.get('/', listarDescuentos);
enrutador.post('/', crearDescuento);
enrutador.put('/:id', editarDescuento);
enrutador.delete('/:id', eliminarDescuento);

export default enrutador;
import { Router } from 'express';
import { listarDescuentos } from '../controladores/controladorDescuento.js';

const enrutador = Router();

enrutador.get('/', listarDescuentos);

export default enrutador;
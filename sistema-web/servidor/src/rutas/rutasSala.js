import { Router } from 'express';
import { listarFormatos, listarSalas, listarTipos } from '../controladores/controladorSala.js';

const enrutador = Router();

enrutador.get('/', listarSalas);
enrutador.get('/tipos', listarTipos);
enrutador.get('/formatos', listarFormatos);

export default enrutador;

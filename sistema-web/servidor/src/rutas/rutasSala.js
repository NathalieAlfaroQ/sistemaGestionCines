import { Router } from 'express';
import { eliminarSala, listarFormatos, listarSalas, listarTipos } from '../controladores/controladorSala.js';

const enrutador = Router();

enrutador.get('/', listarSalas);
enrutador.get('/tipos', listarTipos);
enrutador.get('/formatos', listarFormatos);
enrutador.delete('/:id', eliminarSala);

export default enrutador;

import { Router } from 'express';
import {
  crearSala,
  eliminarSala,
  listarDistribuciones,
  listarFormatos,
  listarSalas,
  listarTipos,
  verSala,
} from '../controladores/controladorSala.js';

const enrutador = Router();

enrutador.get('/', listarSalas);
enrutador.get('/tipos', listarTipos);
enrutador.get('/formatos', listarFormatos);
enrutador.get('/distribuciones', listarDistribuciones);
enrutador.get('/:id', verSala);
enrutador.post('/', crearSala);
enrutador.delete('/:id', eliminarSala);

export default enrutador;

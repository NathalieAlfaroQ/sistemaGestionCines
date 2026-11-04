import { Router } from 'express';
import {
  crearSala,
  editarSala,
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
// Va después de las rutas fijas (/tipos, /formatos, /distribuciones) para que /:id no las capture
enrutador.get('/:id', verSala);
enrutador.post('/', crearSala);
enrutador.put('/:id', editarSala);
enrutador.delete('/:id', eliminarSala);

export default enrutador;

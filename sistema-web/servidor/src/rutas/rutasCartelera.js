import { Router } from 'express';
import { listarCartelera, listarSedes } from '../controladores/controladorCartelera.js';

const enrutador = Router();

enrutador.get('/sedes', listarSedes);
enrutador.get('/', listarCartelera);

export default enrutador;

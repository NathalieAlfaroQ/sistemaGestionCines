import { Router } from 'express';
import { listarSalas } from '../controladores/controladorSala.js';

const enrutador = Router();

enrutador.get('/', listarSalas);

export default enrutador;

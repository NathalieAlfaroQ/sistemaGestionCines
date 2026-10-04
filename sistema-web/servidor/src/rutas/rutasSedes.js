import { Router } from 'express';
import { listarSedes } from '../controladores/controladorSede.js';

const enrutador = Router();

enrutador.get('/', listarSedes);

export default enrutador;
import { Router } from 'express';
import { listarSedes, crearSede } from '../controladores/controladorSede.js';

const enrutador = Router();

enrutador.get('/', listarSedes);
enrutador.post('/', crearSede);

export default enrutador;

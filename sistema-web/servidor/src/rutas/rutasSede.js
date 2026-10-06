import { Router } from 'express';
import { listarSedes, crearSede, eliminarSede } from '../controladores/controladorSede.js';

const enrutador = Router();

enrutador.get('/', listarSedes);
enrutador.post('/', crearSede);
enrutador.delete('/:id', eliminarSede);

export default enrutador;
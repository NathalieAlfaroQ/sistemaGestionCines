import { Router } from 'express';
import { listarSedes, crearSede, editarSede, eliminarSede } from '../controladores/controladorSede.js';

const enrutador = Router();

enrutador.get('/', listarSedes);
enrutador.post('/', crearSede);
enrutador.put('/:id', editarSede);
enrutador.delete('/:id', eliminarSede);

export default enrutador;
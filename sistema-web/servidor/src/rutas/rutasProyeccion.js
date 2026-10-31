import { Router } from 'express';
import { crearProyeccion, eliminarProyeccion, listarProyecciones } from '../controladores/controladorProyeccion.js';

const enrutador = Router();

enrutador.get('/', listarProyecciones);
enrutador.post('/', crearProyeccion);
enrutador.delete('/:id', eliminarProyeccion);

export default enrutador;

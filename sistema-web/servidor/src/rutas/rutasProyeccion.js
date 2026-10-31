import { Router } from 'express';
import { crearProyeccion, editarProyeccion, eliminarProyeccion, listarProyecciones } from '../controladores/controladorProyeccion.js';

const enrutador = Router();

enrutador.get('/', listarProyecciones);
enrutador.post('/', crearProyeccion);
enrutador.put('/:id', editarProyeccion);
enrutador.delete('/:id', eliminarProyeccion);

export default enrutador;

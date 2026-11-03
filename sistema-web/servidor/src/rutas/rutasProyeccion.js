import { Router } from 'express';
import {
  crearProyeccion,
  editarProyeccion,
  eliminarProyeccion,
  listarProyecciones,
  listarTareas,
  verTareasProyeccion,
} from '../controladores/controladorProyeccion.js';

const enrutador = Router();

enrutador.get('/', listarProyecciones);
enrutador.get('/tareas', listarTareas);
enrutador.get('/:id/tareas', verTareasProyeccion);
enrutador.post('/', crearProyeccion);
enrutador.put('/:id', editarProyeccion);
enrutador.delete('/:id', eliminarProyeccion);

export default enrutador;

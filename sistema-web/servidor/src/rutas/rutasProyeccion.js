import { Router } from 'express';
import { crearProyeccion, listarProyecciones } from '../controladores/controladorProyeccion.js';

const enrutador = Router();

enrutador.get('/', listarProyecciones);
enrutador.post('/', crearProyeccion);

export default enrutador;

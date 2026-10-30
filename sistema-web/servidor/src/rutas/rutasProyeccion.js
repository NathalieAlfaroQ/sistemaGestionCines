import { Router } from 'express';
import { listarProyecciones } from '../controladores/controladorProyeccion.js';

const enrutador = Router();

enrutador.get('/', listarProyecciones);

export default enrutador;

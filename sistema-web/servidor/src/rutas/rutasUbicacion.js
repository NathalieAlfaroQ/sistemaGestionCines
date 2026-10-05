import { Router } from 'express';
import { listarUbicaciones } from '../controladores/controladorUbicacion.js';

const enrutador = Router();

enrutador.get('/', listarUbicaciones);

export default enrutador;

import { Router } from 'express';
import { listarHistorialCompras } from '../controladores/controladorHistorialCompras.js';

const enrutador = Router();

enrutador.get('/', listarHistorialCompras);

export default enrutador;
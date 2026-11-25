import { Router } from 'express';
import { actualizarPerfil } from '../controladores/controladorPerfil.js';

const enrutador = Router();

enrutador.put('/', actualizarPerfil);

export default enrutador;
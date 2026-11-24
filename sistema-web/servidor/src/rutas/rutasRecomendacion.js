import { Router } from 'express';
import { identificarUsuario, listarRecomendaciones } from '../controladores/controladorRecomendacion.js';

const enrutador = Router();

enrutador.get('/', identificarUsuario, listarRecomendaciones);

export default enrutador;
import { Router } from 'express';
import { listarPeliculas } from '../controladores/controladorPelicula.js';

const enrutador = Router();

enrutador.get('/', listarPeliculas);

export default enrutador;
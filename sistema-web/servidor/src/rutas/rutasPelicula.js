import { Router } from 'express';
import { listarPeliculas, crearPelicula } from '../controladores/controladorPelicula.js';

const enrutador = Router();

enrutador.get('/', listarPeliculas);
enrutador.post('/', crearPelicula);

export default enrutador;
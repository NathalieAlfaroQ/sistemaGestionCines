import { Router } from 'express';
import { listarPeliculas, crearPelicula, subirImagenPelicula } from '../controladores/controladorPelicula.js';
import { subidaImagen } from '../middlewares/subidaImagen.js';

const enrutador = Router();

enrutador.get('/', listarPeliculas);
enrutador.post('/', crearPelicula);
enrutador.put('/:id/imagenes/:tipo', subidaImagen, subirImagenPelicula);

export default enrutador;
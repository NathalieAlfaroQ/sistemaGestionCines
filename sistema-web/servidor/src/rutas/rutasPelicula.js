import { Router } from 'express';
import {
  crearPelicula,
  eliminarPelicula,
  listarPeliculas,
  subirImagenPelicula,
  verPelicula,
} from '../controladores/controladorPelicula.js';
import { subidaImagen } from '../middlewares/subidaImagen.js';

const enrutador = Router();

enrutador.get('/', listarPeliculas);
enrutador.post('/', crearPelicula);
enrutador.put('/:id/imagenes/:tipo', subidaImagen, subirImagenPelicula);
enrutador.delete('/:id', eliminarPelicula);
enrutador.get('/:id', verPelicula);

export default enrutador;
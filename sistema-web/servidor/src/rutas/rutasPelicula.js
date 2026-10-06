import { Router } from 'express';
import {
  crearPelicula,
  editarPelicula,
  eliminarPelicula,
  listarPeliculas,
  subirImagenPelicula,
  verPelicula,
} from '../controladores/controladorPelicula.js';
import { subidaImagen } from '../middlewares/subidaImagen.js';

const enrutador = Router();

enrutador.get('/', listarPeliculas);
enrutador.get('/:id', verPelicula);
enrutador.post('/', crearPelicula);
enrutador.put('/:id', editarPelicula);
enrutador.put('/:id/imagenes/:tipo', subidaImagen, subirImagenPelicula);
enrutador.delete('/:id', eliminarPelicula);

export default enrutador;
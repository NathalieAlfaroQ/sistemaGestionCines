import { Router } from 'express';
import { peliculasMasVistas, recaudacionPorPelicula, sedes, ventas } from '../controladores/controladorEstadistica.js';

const enrutador = Router();

enrutador.get('/ventas', ventas);
enrutador.get('/peliculas-mas-vistas', peliculasMasVistas);
enrutador.get('/recaudacion-por-pelicula', recaudacionPorPelicula);
enrutador.get('/sedes', sedes);

export default enrutador;
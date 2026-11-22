import { Router } from 'express';
import { peliculasMasVistas, sedes, ventas } from '../controladores/controladorEstadistica.js';

const enrutador = Router();

enrutador.get('/ventas', ventas);
enrutador.get('/peliculas-mas-vistas', peliculasMasVistas);
enrutador.get('/sedes', sedes);

export default enrutador;
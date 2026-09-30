import { Router } from 'express';
  import { catalogo } from '../controladores/controladorCatalogo.js';

  const enrutador = Router();
  enrutador.get('/', catalogo);

  export default enrutador;
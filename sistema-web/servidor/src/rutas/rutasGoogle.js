import { Router } from 'express';
import { iniciarSesionGoogle } from '../controladores/controladorGoogle.js';

const router = Router();

router.post('/', iniciarSesionGoogle);

export default router;
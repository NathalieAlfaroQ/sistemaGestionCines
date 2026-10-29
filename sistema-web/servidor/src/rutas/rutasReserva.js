import { Router } from 'express';
import {
  listarHorarios,
  verAsientos,
  verificarAsientos,
  verPelicula,
} from '../controladores/controladorReserva.js';
import { verificarAutenticacion } from '../middlewares/autenticacion.js';
import { autorizarRoles } from '../middlewares/autorizacion.js';

const enrutador = Router();

// Públicas: cualquiera puede ver horarios y la disponibilidad de la sala
enrutador.get('/peliculas/:id', verPelicula);
enrutador.get('/peliculas/:id/proyecciones', listarHorarios);
enrutador.get('/proyecciones/:id/asientos', verAsientos);

// Solo clientes y empleados con sesión pueden continuar hacia el pago
enrutador.post(
  '/proyecciones/:id/verificacion',
  verificarAutenticacion,
  autorizarRoles('CLIENTE', 'EMPLEADO', 'ADMINISTRADOR'),
  verificarAsientos
);

export default enrutador;
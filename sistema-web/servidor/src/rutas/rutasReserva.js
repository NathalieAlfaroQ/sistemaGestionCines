import { Router } from 'express';
import {
  cancelarMiReserva,
  listarHorarios,
  reservarAsientos,
  verAsientos,
  verificarAsientos,
  verMiReserva,
  verPelicula,
} from '../controladores/controladorReserva.js';
import { verificarAutenticacion } from '../middlewares/autenticacion.js';
import { autorizarRoles } from '../middlewares/autorizacion.js';

const enrutador = Router();

// Públicas: cualquiera puede ver horarios y la disponibilidad de la sala
enrutador.get('/peliculas/:id', verPelicula);
enrutador.get('/peliculas/:id/proyecciones', listarHorarios);
enrutador.get('/proyecciones/:id/asientos', verAsientos);

// Solo clientes con sesión pueden continuar hacia el pago
enrutador.post(
  '/proyecciones/:id/verificacion',
  verificarAutenticacion,
  autorizarRoles('CLIENTE'),
  verificarAsientos
);

// Reserva temporal de asientos (una por cliente). Se identifica por el cliente de la sesión.
const soloClientes = [verificarAutenticacion, autorizarRoles('CLIENTE')];
enrutador.post('/proyecciones/:id/reservas', ...soloClientes, reservarAsientos);
enrutador.get('/mi-reserva', ...soloClientes, verMiReserva);
enrutador.delete('/mi-reserva', ...soloClientes, cancelarMiReserva);

export default enrutador;

import {
  desactivarSala as desactivarSalaEnRepositorio,
  listarFormatos,
  listarSalas,
  listarTipos,
} from '../repositorios/repositorioSala.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

const ESTADOS_SALA = { activas: 1, eliminadas: 0, todas: null };

function idDeFiltro(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') return null;

  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion(`El filtro de ${nombreCampo} no es válido`);
  }
  return id;
}

export async function obtenerSalas({ busqueda, idSede, idTipo, idFormato, estado = 'activas' } = {}) {
  if (!Object.hasOwn(ESTADOS_SALA, estado)) {
    throw new ErrorValidacion('El filtro de estado no es válido');
  }

  const texto = typeof busqueda === 'string' ? busqueda.trim() : '';

  return await listarSalas({
    busqueda: texto || null,
    idSede: idDeFiltro(idSede, 'cine'),
    idTipo: idDeFiltro(idTipo, 'tipo'),
    idFormato: idDeFiltro(idFormato, 'formato'),
    estado: ESTADOS_SALA[estado],
  });
}

export async function obtenerTipos() {
  return await listarTipos();
}

export async function obtenerFormatos() {
  return await listarFormatos();
}

export async function desactivarSala(idSala) {
  const id = Number(idSala);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion('El identificador de la sala no es válido');
  }

  return await desactivarSalaEnRepositorio(id);
}

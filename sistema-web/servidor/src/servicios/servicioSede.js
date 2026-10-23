import {
  crearSede,
  desactivarSede as desactivarSedeEnRepositorio,
  existeCanton,
  listarSedes,
} from '../repositorios/repositorioSede.js';

import { ErrorValidacion } from '../errores/ErrorValidacion.js';

const NOMBRE_MINIMO = 10;
const NOMBRE_MAXIMO = 30;
const PATRON_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

const ORA_UNICIDAD = 1;

const ORA_NOMBRE_MAX = 12899;


function validarDatosSede(datos) {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorValidacion('Los datos de la sede no son válidos');
  }

  if (typeof datos.nombre !== 'string') throw new ErrorValidacion('El nombre es obligatorio');

  const nombre = datos.nombre.trim().replace(/\s+/g, ' ');
  const idCanton = Number(datos.idCanton);

  if (nombre === '') throw new ErrorValidacion('El nombre es obligatorio');
  if (!PATRON_NOMBRE.test(nombre)) throw new ErrorValidacion('El nombre solo admite letras y espacios');
  if (nombre.length < NOMBRE_MINIMO) throw new ErrorValidacion(`El nombre debe tener al menos ${NOMBRE_MINIMO} caracteres`);
  if (nombre.length > NOMBRE_MAXIMO) throw new ErrorValidacion(`El nombre no puede superar los ${NOMBRE_MAXIMO} caracteres`);
  if (!Number.isInteger(idCanton) || idCanton <= 0) throw new ErrorValidacion('El cantón es obligatorio');

  return { nombre, idCanton };
}

export async function registrarSede(datos) {
  const { nombre, idCanton } = validarDatosSede(datos);

  if (!(await existeCanton(idCanton))) throw new ErrorValidacion('El cantón seleccionado no existe');

  try {
    return await crearSede({ nombre, idCanton });
  } catch (error) {
    if (error.errorNum === ORA_UNICIDAD) {
      throw new ErrorValidacion('Ya existe una sede con ese nombre');
    }
    if (error.errorNum === ORA_NOMBRE_MAX) {
      throw new ErrorValidacion(`El nombre no puede superar los ${NOMBRE_MAXIMO} caracteres`);
    }
    throw error;
  }
}

const ESTADOS_SEDE = { activas: 1, eliminadas: 0, todas: null };

function idDeFiltro(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') return null;

  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion(`El filtro de ${nombreCampo} no es válido`);
  }
  return id;
}

export async function obtenerSedes({ busqueda, nombre, idProvincia, idCanton, estado = 'activas' } = {}) {
  if (!Object.hasOwn(ESTADOS_SEDE, estado)) {
    throw new ErrorValidacion('El filtro de estado no es válido');
  }

  return await listarSedes({
    busqueda: busqueda || null,
    nombre: nombre || null,
    idProvincia: idDeFiltro(idProvincia, 'provincia'),
    idCanton: idDeFiltro(idCanton, 'cantón'),
    estado: ESTADOS_SEDE[estado],
  });
}

export async function desactivarSede(idSede) {
  const id = Number(idSede);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion('El identificador de la sede no es válido');
  }

  return await desactivarSedeEnRepositorio(id);
}

import { crearSede, existeCanton, listarSedes } from '../repositorios/repositorioSede.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

const NOMBRE_MAXIMO = 50;

const ORA_UNICIDAD = 1;

export async function registrarSede(datos = {}) {
  const nombre = String(datos.nombre ?? '').trim();
  const idCanton = Number(datos.idCanton);

  if (nombre === '') throw new ErrorValidacion('El nombre es obligatorio');
  if (nombre.length > NOMBRE_MAXIMO) throw new ErrorValidacion(`El nombre no puede superar los ${NOMBRE_MAXIMO} caracteres`);
  if (!Number.isInteger(idCanton) || idCanton <= 0) throw new ErrorValidacion('El cantón es obligatorio');
  if (!(await existeCanton(idCanton))) throw new ErrorValidacion('El cantón seleccionado no existe');

  try {
    return await crearSede({ nombre, idCanton });
  } catch (error) {
    if (error.errorNum === ORA_UNICIDAD) {
      throw new ErrorValidacion('Ya existe una sede con ese nombre');
    }
    throw error;
  }
}

export async function obtenerSedes(busqueda) {
  return await listarSedes(busqueda);
}

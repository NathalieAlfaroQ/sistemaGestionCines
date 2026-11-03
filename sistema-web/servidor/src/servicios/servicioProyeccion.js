import {
  buscarChoqueDeHorario,
  actualizarProyeccion,
  crearProyeccion,
  desactivarProyeccion as desactivarProyeccionEnRepositorio,
  existeSalaActiva,
  listarProyecciones,
  listarTareas,
  obtenerDuracionPelicula,
  obtenerTareasDeProyeccion as obtenerTareasDeProyeccionEnRepositorio,
} from '../repositorios/repositorioProyeccion.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { estadoDeFiltro, exigirObjeto, idDeFiltro, idObligatorio } from '../utilidades/validaciones.js';

const ESTADOS_PROYECCION = { activas: 1, eliminadas: 0, todas: null };

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// MINUTOS_RESERVADOS es NUMBER(5): no admite más de 99999
const MINUTOS_TAREA_MAXIMO = 99999;

// Acepta solo AAAA-MM-DD y que el día exista (rechaza 2026-02-30)
function esFechaReal(valor) {
  const partes = PATRON_FECHA.exec(valor);
  if (!partes) return false;

  const [, anio, mes, dia] = partes.map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function fechaDeFiltro(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  if (!esFechaReal(valor)) throw new ErrorValidacion('El filtro de fecha no es válido');
  return valor;
}

function horaDeFiltro(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  if (!PATRON_HORA.test(valor)) throw new ErrorValidacion('El filtro de hora no es válido');
  return valor;
}

export async function obtenerProyecciones({
  busqueda,
  idPelicula,
  idSala,
  idSede,
  fecha,
  hora,
  estado = 'activas',
} = {}) {
  const idEstado = estadoDeFiltro(estado, ESTADOS_PROYECCION);
  const texto = typeof busqueda === 'string' ? busqueda.trim() : '';

  return await listarProyecciones({
    busqueda: texto || null,
    idPelicula: idDeFiltro(idPelicula, 'película'),
    idSala: idDeFiltro(idSala, 'sala'),
    idSede: idDeFiltro(idSede, 'cine'),
    fecha: fechaDeFiltro(fecha),
    hora: horaDeFiltro(hora),
    estado: idEstado,
  });
}

// 'sv-SE' formatea como 'AAAA-MM-DD HH:MM', hora del cine (Costa Rica) y no la del servidor
const formateadorCostaRica = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Costa_Rica',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function validarDatosProyeccion(datos) {
  exigirObjeto(datos, 'Los datos de la proyección no son válidos');

  const idPelicula = idObligatorio(datos.idPelicula, 'La película es obligatoria');
  const idSala = idObligatorio(datos.idSala, 'La sala es obligatoria');

  if (typeof datos.fecha !== 'string' || datos.fecha === '') throw new ErrorValidacion('La fecha es obligatoria');
  if (!esFechaReal(datos.fecha)) throw new ErrorValidacion('La fecha no es válida');

  if (typeof datos.hora !== 'string' || datos.hora === '') throw new ErrorValidacion('La hora es obligatoria');
  if (!PATRON_HORA.test(datos.hora)) throw new ErrorValidacion('La hora no es válida');

  return { idPelicula, idSala, fechaHora: `${datos.fecha} ${datos.hora}`, tareas: validarTareas(datos.tareas) };
}

// Tareas adicionales (opcionales): [{ idTarea, minutos }, ...] sin repetir la tarea
function validarTareas(tareas) {
  if (tareas === undefined || tareas === null) return [];
  if (!Array.isArray(tareas)) throw new ErrorValidacion('Las tareas no son válidas');

  const idsVistos = new Set();

  return tareas.map((tarea) => {
    exigirObjeto(tarea, 'Las tareas no son válidas');

    const idTarea = idObligatorio(tarea.idTarea, 'La tarea es obligatoria');
    const minutos = Number(tarea.minutos);

    if (tarea.minutos === undefined || tarea.minutos === null || tarea.minutos === '' || !Number.isInteger(minutos)) {
      throw new ErrorValidacion('Los minutos de la tarea son obligatorios');
    }
    if (minutos < 1 || minutos > MINUTOS_TAREA_MAXIMO) {
      throw new ErrorValidacion(`Los minutos de la tarea deben estar entre 1 y ${MINUTOS_TAREA_MAXIMO}`);
    }
    if (idsVistos.has(idTarea)) throw new ErrorValidacion('No se puede repetir una tarea');
    idsVistos.add(idTarea);

    return { idTarea, minutos };
  });
}

function validarIdProyeccion(idProyeccion) {
  return idObligatorio(idProyeccion, 'El identificador de la proyección no es válido');
}

async function validarQueExistanLasTareas(tareas) {
  if (tareas.length === 0) return;

  const existentes = new Set((await listarTareas()).map((fila) => fila[0]));
  if (tareas.some((tarea) => !existentes.has(tarea.idTarea))) {
    throw new ErrorValidacion('Una de las tareas seleccionadas no existe');
  }
}

// Reglas de negocio comunes a crear y editar. Al editar, la proyección no choca consigo misma.
async function validarProgramacion({ idPelicula, idSala, fechaHora, tareas }, idExcluida = null) {
  if (fechaHora <= formateadorCostaRica.format(new Date())) {
    throw new ErrorValidacion('La proyección debe ser posterior a la fecha y hora actuales');
  }

  const duracion = await obtenerDuracionPelicula(idPelicula);
  if (duracion === null) throw new ErrorValidacion('La película seleccionada no existe');

  if (!(await existeSalaActiva(idSala))) throw new ErrorValidacion('La sala seleccionada no existe');

  await validarQueExistanLasTareas(tareas);

  // La sala queda ocupada por la película y por el tiempo de las tareas adicionales
  const minutosDeTareas = tareas.reduce((total, tarea) => total + tarea.minutos, 0);

  const choque = await buscarChoqueDeHorario({ idSala, fechaHora, duracion: duracion + minutosDeTareas, idExcluida });

  if (choque) {
    throw new ErrorConflicto(
      `La sala ya tiene una proyección en ese horario: "${choque.titulo}" de ${choque.inicio} a ${choque.fin}`,
    );
  }
}

export async function registrarProyeccion(datos) {
  const proyeccion = validarDatosProyeccion(datos);

  await validarProgramacion(proyeccion);

  return await crearProyeccion(proyeccion);
}

export async function modificarProyeccion(idProyeccion, datos) {
  const id = validarIdProyeccion(idProyeccion);
  const proyeccion = validarDatosProyeccion(datos);

  await validarProgramacion(proyeccion, id);

  if (!(await actualizarProyeccion({ idProyeccion: id, ...proyeccion }))) {
    throw new ErrorNoEncontrado('La proyección no existe o ya fue eliminada');
  }
}

export async function desactivarProyeccion(idProyeccion) {
  const id = validarIdProyeccion(idProyeccion);

  if (!(await desactivarProyeccionEnRepositorio(id))) {
    throw new ErrorNoEncontrado('La proyección no existe o ya fue eliminada');
  }
}

export async function obtenerTareas() {
  return await listarTareas();
}

export async function obtenerTareasDeProyeccion(idProyeccion) {
  return await obtenerTareasDeProyeccionEnRepositorio(validarIdProyeccion(idProyeccion));
}

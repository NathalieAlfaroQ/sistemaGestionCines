import {
  crearProyeccion,
  existeSalaActiva,
  hayChoqueDeHorario,
  listarProyecciones,
  obtenerDuracionPelicula,
} from '../repositorios/repositorioProyeccion.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';

const ESTADOS_PROYECCION = { activas: 1, eliminadas: 0, todas: null };

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function idDeFiltro(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') return null;

  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion(`El filtro de ${nombreCampo} no es válido`);
  }
  return id;
}

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
  if (!Object.hasOwn(ESTADOS_PROYECCION, estado)) {
    throw new ErrorValidacion('El filtro de estado no es válido');
  }

  const texto = typeof busqueda === 'string' ? busqueda.trim() : '';

  return await listarProyecciones({
    busqueda: texto || null,
    idPelicula: idDeFiltro(idPelicula, 'película'),
    idSala: idDeFiltro(idSala, 'sala'),
    idSede: idDeFiltro(idSede, 'cine'),
    fecha: fechaDeFiltro(fecha),
    hora: horaDeFiltro(hora),
    estado: ESTADOS_PROYECCION[estado],
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

function idObligatorio(valor, mensaje) {
  const id = Number(valor);
  if (valor === undefined || valor === null || valor === '' || !Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion(mensaje);
  }
  return id;
}

function validarDatosProyeccion(datos) {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorValidacion('Los datos de la proyección no son válidos');
  }

  const idPelicula = idObligatorio(datos.idPelicula, 'La película es obligatoria');
  const idSala = idObligatorio(datos.idSala, 'La sala es obligatoria');

  if (typeof datos.fecha !== 'string' || datos.fecha === '') throw new ErrorValidacion('La fecha es obligatoria');
  if (!esFechaReal(datos.fecha)) throw new ErrorValidacion('La fecha no es válida');

  if (typeof datos.hora !== 'string' || datos.hora === '') throw new ErrorValidacion('La hora es obligatoria');
  if (!PATRON_HORA.test(datos.hora)) throw new ErrorValidacion('La hora no es válida');

  return { idPelicula, idSala, fechaHora: `${datos.fecha} ${datos.hora}` };
}

export async function registrarProyeccion(datos) {
  const { idPelicula, idSala, fechaHora } = validarDatosProyeccion(datos);

  if (fechaHora <= formateadorCostaRica.format(new Date())) {
    throw new ErrorValidacion('La proyección debe ser posterior a la fecha y hora actuales');
  }

  const duracion = await obtenerDuracionPelicula(idPelicula);
  if (duracion === null) throw new ErrorValidacion('La película seleccionada no existe');

  if (!(await existeSalaActiva(idSala))) throw new ErrorValidacion('La sala seleccionada no existe');

  if (await hayChoqueDeHorario({ idSala, fechaHora, duracion })) {
    throw new ErrorConflicto('La sala ya tiene una proyección en ese horario');
  }

  return await crearProyeccion({ idSala, idPelicula, fechaHora });
}

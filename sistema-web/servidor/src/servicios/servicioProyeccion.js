import { listarProyecciones } from '../repositorios/repositorioProyeccion.js';
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
function fechaDeFiltro(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  const partes = PATRON_FECHA.exec(valor);
  if (partes) {
    const [, anio, mes, dia] = partes.map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia) {
      return valor;
    }
  }
  throw new ErrorValidacion('El filtro de fecha no es válido');
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

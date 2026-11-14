import { listarDescuentos } from '../repositorios/repositorioDescuento.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { estadoDeFiltro, idDeFiltro } from '../utilidades/validaciones.js';

const ESTADOS_DESCUENTO = { activos: 1, eliminados: 0, todos: null };

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

// Acepta solo AAAA-MM-DD y que el día exista (rechaza 2026-02-30)
function esFechaReal(valor) {
  const partes = PATRON_FECHA.exec(valor);
  if (!partes) return false;

  const [, anio, mes, dia] = partes.map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function fechaDeFiltro(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') return null;

  if (!esFechaReal(valor)) throw new ErrorValidacion(`El filtro de ${nombreCampo} no es válido`);
  return valor;
}

export async function obtenerDescuentos({ busqueda, idSede, idPelicula, fechaInicio, fechaFin, estado = 'activos' } = {}) {
  const idEstado = estadoDeFiltro(estado, ESTADOS_DESCUENTO);
  const texto = typeof busqueda === 'string' ? busqueda.trim() : '';

  return await listarDescuentos({
    busqueda: texto || null,
    idSede: idDeFiltro(idSede, 'cine'),
    idPelicula: idDeFiltro(idPelicula, 'película'),
    fechaInicio: fechaDeFiltro(fechaInicio, 'fecha de inicio'),
    fechaFin: fechaDeFiltro(fechaFin, 'fecha de fin'),
    estado: idEstado,
  });
}
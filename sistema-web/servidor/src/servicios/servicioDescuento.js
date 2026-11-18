import {
  buscarChoqueDeDescuento,
  contarPeliculasActivas,
  crearDescuento,
  desactivarDescuento as desactivarDescuentoEnRepositorio,
  existeSedeActiva,
  listarDescuentos,
} from '../repositorios/repositorioDescuento.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { ahoraCostaRica } from '../utilidades/fechas.js';
import { estadoDeFiltro, exigirObjeto, idDeFiltro, idObligatorio } from '../utilidades/validaciones.js';

const ESTADOS_DESCUENTO = { activos: 1, eliminados: 0, todos: null };

const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const NOMBRE_MAXIMO = 50;

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

function validarNombre(nombre) {
  const texto = typeof nombre === 'string' ? nombre.trim() : '';

  if (texto === '') throw new ErrorValidacion('El nombre es obligatorio');
  if (texto.length > NOMBRE_MAXIMO) throw new ErrorValidacion(`El nombre no puede superar los ${NOMBRE_MAXIMO} caracteres`);
  return texto;
}

// PORCENTAJE es NUMBER(5,2): mayor que 0, máximo 100 y hasta dos decimales
function validarPorcentaje(valor) {
  if (valor === undefined || valor === null || valor === '') throw new ErrorValidacion('El porcentaje es obligatorio');

  const porcentaje = Number(valor);
  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
    throw new ErrorValidacion('El porcentaje debe ser mayor que 0 y no mayor que 100');
  }
  if (Math.round(porcentaje * 100) / 100 !== porcentaje) {
    throw new ErrorValidacion('El porcentaje admite máximo dos decimales');
  }
  return porcentaje;
}

function validarPeliculas(ids, aplicaTodas) {
  if (aplicaTodas) return [];
  if (!Array.isArray(ids) || ids.length === 0) throw new ErrorValidacion('Debe seleccionar al menos una película');

  const idsPeliculas = ids.map((id) => idObligatorio(id, 'Las películas seleccionadas no son válidas'));
  if (new Set(idsPeliculas).size !== idsPeliculas.length) throw new ErrorValidacion('No se puede repetir una película');
  return idsPeliculas;
}

function validarMomento(fecha, hora, nombreCampo) {
  if (typeof fecha !== 'string' || fecha === '') throw new ErrorValidacion(`La fecha de ${nombreCampo} es obligatoria`);
  if (!esFechaReal(fecha)) throw new ErrorValidacion(`La fecha de ${nombreCampo} no es válida`);

  if (typeof hora !== 'string' || hora === '') throw new ErrorValidacion(`La hora de ${nombreCampo} es obligatoria`);
  if (!PATRON_HORA.test(hora)) throw new ErrorValidacion(`La hora de ${nombreCampo} no es válida`);

  return `${fecha} ${hora}`;
}

function validarAplicaTodas(valor) {
  if (valor === undefined || valor === null) return false;
  if (typeof valor !== 'boolean') throw new ErrorValidacion('La opción de todas las películas no es válida');
  return valor;
}

function validarDatosDescuento(datos) {
  exigirObjeto(datos, 'Los datos del descuento no son válidos');

  const nombre = validarNombre(datos.nombre);
  const idSede = idObligatorio(datos.idSede, 'El cine es obligatorio');
  const aplicaTodas = validarAplicaTodas(datos.aplicaTodas);
  const idsPeliculas = validarPeliculas(datos.idsPeliculas, aplicaTodas);
  const porcentaje = validarPorcentaje(datos.porcentaje);
  const fechaInicio = validarMomento(datos.fechaInicio, datos.horaInicio, 'inicio');
  const fechaFin = validarMomento(datos.fechaFin, datos.horaFin, 'fin');

  if (fechaFin <= fechaInicio) {
    throw new ErrorValidacion('La fecha y hora de fin debe ser posterior a la de inicio');
  }

  return { nombre, idSede, aplicaTodas, idsPeliculas, porcentaje, fechaInicio, fechaFin };
}

export async function registrarDescuento(datos) {
  const descuento = validarDatosDescuento(datos);

  if (descuento.fechaFin <= ahoraCostaRica().slice(0, 16)) {
    throw new ErrorValidacion('La fecha y hora de fin debe ser posterior a la fecha y hora actuales');
  }

  if (!(await existeSedeActiva(descuento.idSede))) throw new ErrorValidacion('El cine seleccionado no existe');

  if (!descuento.aplicaTodas && (await contarPeliculasActivas(descuento.idsPeliculas)) !== descuento.idsPeliculas.length) {
    throw new ErrorValidacion('Una de las películas seleccionadas no existe');
  }

  const choque = await buscarChoqueDeDescuento(descuento);
  if (choque) {
    const aplicaA = choque.titulo ? `"${choque.titulo}"` : 'todas las películas';
    throw new ErrorConflicto(`El descuento "${choque.nombre}" ya aplica a ${aplicaA} en ese cine durante ese periodo`);
  }

  return await crearDescuento(descuento);
}

export async function desactivarDescuento(idDescuento) {
  const id = idObligatorio(idDescuento, 'El identificador del descuento no es válido');

  if (!(await desactivarDescuentoEnRepositorio(id))) {
    throw new ErrorNoEncontrado('El descuento no existe o ya fue eliminado');
  }
}
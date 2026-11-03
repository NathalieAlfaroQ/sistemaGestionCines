import {
  crearSalaConAsientos,
  desactivarSala as desactivarSalaEnRepositorio,
  existeNombreSala,
  existeSedeActiva,
  listarDistribuciones,
  listarFormatos,
  listarSalas,
  listarTipos,
  obtenerDistribucion,
  obtenerPrecioFormato,
  obtenerPrecioTipo,
  obtenerSala as obtenerSalaEnRepositorio,
} from '../repositorios/repositorioSala.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { estadoDeFiltro, exigirObjeto, idDeFiltro, idObligatorio } from '../utilidades/validaciones.js';

const ESTADOS_SALA = { activas: 1, eliminadas: 0, todas: null };

export async function obtenerSalas({ busqueda, idSede, idTipo, idFormato, estado = 'activas' } = {}) {
  const idEstado = estadoDeFiltro(estado, ESTADOS_SALA);
  const texto = typeof busqueda === 'string' ? busqueda.trim() : '';

  return await listarSalas({
    busqueda: texto || null,
    idSede: idDeFiltro(idSede, 'cine'),
    idTipo: idDeFiltro(idTipo, 'tipo'),
    idFormato: idDeFiltro(idFormato, 'formato'),
    estado: idEstado,
  });
}

export async function obtenerTipos() {
  return await listarTipos();
}

export async function obtenerFormatos() {
  return await listarFormatos();
}

export async function obtenerDistribuciones() {
  return await listarDistribuciones();
}

export const NOMBRE_SALA_MINIMO = 5;
export const NOMBRE_SALA_MAXIMO = 20;

const PATRON_NOMBRE_SALA = /^[\p{L}\d]+(?: [\p{L}\d]+)*$/u;

export function nombreFila(indice) {
  let numero = indice + 1;
  let nombre = '';
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    nombre = String.fromCodePoint(65 + resto) + nombre;
    numero = Math.floor((numero - 1) / 26);
  }
  return nombre;
}

export function generarAsientos(filas, columnas) {
  const asientos = [];
  for (let fila = 0; fila < filas; fila++) {
    for (let numero = 1; numero <= columnas; numero++) {
      asientos.push({ fila: nombreFila(fila), numero });
    }
  }
  return asientos;
}

function validarDatosSala(datos) {
  exigirObjeto(datos, 'Los datos de la sala no son válidos');

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim().replaceAll(/\s+/g, ' ') : '';
  if (nombre === '') throw new ErrorValidacion('El nombre es obligatorio');
  if (!PATRON_NOMBRE_SALA.test(nombre)) throw new ErrorValidacion('El nombre solo admite letras y números');
  if (nombre.length < NOMBRE_SALA_MINIMO) {
    throw new ErrorValidacion(`El nombre debe tener al menos ${NOMBRE_SALA_MINIMO} caracteres`);
  }
  if (nombre.length > NOMBRE_SALA_MAXIMO) {
    throw new ErrorValidacion(`El nombre no puede superar los ${NOMBRE_SALA_MAXIMO} caracteres`);
  }

  return {
    nombre,
    idSede: idObligatorio(datos.idSede, 'El cine es obligatorio'),
    idTipo: idObligatorio(datos.idTipo, 'El tipo es obligatorio'),
    idFormato: idObligatorio(datos.idFormato, 'El formato es obligatorio'),
    idDistribucion: idObligatorio(datos.idDistribucion, 'La distribución es obligatoria'),
  };
}

// El monto de la sala no lo digita el usuario: es el precio del tipo más el del formato
export async function registrarSala(datos) {
  const sala = validarDatosSala(datos);

  if (!(await existeSedeActiva(sala.idSede))) throw new ErrorValidacion('El cine seleccionado no existe');

  const precioTipo = await obtenerPrecioTipo(sala.idTipo);
  if (precioTipo === null) throw new ErrorValidacion('El tipo de sala seleccionado no existe');

  const precioFormato = await obtenerPrecioFormato(sala.idFormato);
  if (precioFormato === null) throw new ErrorValidacion('El formato seleccionado no existe');

  const distribucion = await obtenerDistribucion(sala.idDistribucion);
  if (distribucion === null) throw new ErrorValidacion('La distribución seleccionada no existe');

  if (await existeNombreSala({ idSede: sala.idSede, nombre: sala.nombre })) {
    throw new ErrorConflicto('Ya existe una sala con ese nombre en este cine');
  }

  const [filas, columnas] = distribucion;

  return await crearSalaConAsientos({
    ...sala,
    monto: precioTipo + precioFormato,
    asientos: generarAsientos(filas, columnas),
  });
}

export async function desactivarSala(idSala) {
  const id = idObligatorio(idSala, 'El identificador de la sala no es válido');

  if (!(await desactivarSalaEnRepositorio(id))) {
    throw new ErrorNoEncontrado('La sala no existe o ya fue eliminada');
  }
}

export async function obtenerSala(idSala) {
  const id = idObligatorio(idSala, 'El identificador de la sala no es válido');

  const sala = await obtenerSalaEnRepositorio(id);
  if (!sala) {
    throw new ErrorNoEncontrado('La sala no existe');
  }

  return sala;
}

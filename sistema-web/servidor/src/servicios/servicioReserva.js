import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import {
  contarAsientosDeSala,
  listarAsientos,
  listarAsientosOcupados,
  listarHorarios,
  listarTiposBoleto,
  obtenerPelicula,
  obtenerProyeccionVigente,
} from '../repositorios/repositorioReserva.js';
import { obtenerUrlImagen } from './almacenamientoImagenes.js';

export const MENSAJE_ASIENTO_NO_DISPONIBLE =
  'El asiento seleccionado ya no está disponible. Por favor, elige otro.';
export const MENSAJE_FALTAN_ASIENTOS = 'Te faltan asientos por seleccionar';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Regla de negocio: toda película en un idioma distinto del español se proyecta subtitulada al español.
const IDIOMA_LOCAL = 'Español';

function esSubtitulada(idiomas) {
  return idiomas.some((nombre) => nombre !== IDIOMA_LOCAL);
}

// 'sv-SE' formatea como 'AAAA-MM-DD HH:MM:SS', el mismo formato que espera el repositorio
const formateadorCostaRica = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Costa_Rica',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function ahoraCostaRica() {
  return formateadorCostaRica.format(new Date());
}

function validarId(id, nombre) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion(`El id de ${nombre} no es válido`);
  }
}

// Sin fecha se usa la de hoy. La fecha debe existir en el calendario y no ser anterior a hoy.
function validarFecha(fecha, hoy) {
  if (fecha === undefined || fecha === '') return hoy;

  if (typeof fecha !== 'string' || !PATRON_FECHA.test(fecha)) {
    throw new ErrorValidacion('La fecha debe tener el formato AAAA-MM-DD');
  }
  const fechaReal = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(fechaReal.getTime()) || fechaReal.toISOString().slice(0, 10) !== fecha) {
    throw new ErrorValidacion('La fecha no es válida');
  }
  if (fecha < hoy) {
    throw new ErrorValidacion('La fecha no puede ser anterior a hoy');
  }
  return fecha;
}

function validarAsientos(asientos) {
  if (!Array.isArray(asientos) || asientos.length === 0) {
    throw new ErrorValidacion('Debes seleccionar al menos un asiento');
  }
  const ids = asientos.map(Number);
  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw new ErrorValidacion('Los asientos no son válidos');
  }
  if (new Set(ids).size !== ids.length) {
    throw new ErrorValidacion('Hay asientos repetidos en la selección');
  }
  return ids;
}

// Devuelve solo los tipos con cantidad mayor que cero: [{ idTipoBoleto, cantidad }]
function validarBoletos(boletos) {
  if (!Array.isArray(boletos)) {
    throw new ErrorValidacion('Los boletos no son válidos');
  }

  const normalizados = boletos.map((boleto) => ({
    idTipoBoleto: Number(boleto?.idTipoBoleto),
    cantidad: Number(boleto?.cantidad),
  }));

  const sonValidos = normalizados.every(
    ({ idTipoBoleto, cantidad }) =>
      Number.isInteger(idTipoBoleto) && idTipoBoleto > 0 && Number.isInteger(cantidad) && cantidad >= 0
  );
  if (!sonValidos) {
    throw new ErrorValidacion('Los boletos no son válidos');
  }

  const tipos = normalizados.map(({ idTipoBoleto }) => idTipoBoleto);
  if (new Set(tipos).size !== tipos.length) {
    throw new ErrorValidacion('Hay tipos de boleto repetidos');
  }

  const conCantidad = normalizados.filter(({ cantidad }) => cantidad > 0);
  if (conCantidad.length === 0) {
    throw new ErrorValidacion('Debes elegir al menos un boleto');
  }
  return conCantidad;
}

// Encabezado de la película que comparten las dos pantallas
export async function consultarPelicula(idPelicula) {
  validarId(idPelicula, 'la película');

  const detalle = await obtenerPelicula(idPelicula, ahoraCostaRica());
  if (!detalle) {
    throw new ErrorNoEncontrado('La película no existe');
  }

  const [id, titulo, duracion, clasificacion, sinopsis, clavePoster, claveBanner] = detalle.fila;

  return {
    pelicula: [
      id,
      titulo,
      duracion,
      clasificacion,
      sinopsis,
      obtenerUrlImagen(clavePoster),
      obtenerUrlImagen(claveBanner),
    ],
    generos: detalle.generos,
    subtitulada: esSubtitulada(detalle.idiomas),
    formatos: detalle.formatos,
  };
}

// Horarios vigentes de la película en un día
export async function consultarHorarios(idPelicula, fecha) {
  validarId(idPelicula, 'la película');

  const ahora = ahoraCostaRica();
  const dia = validarFecha(fecha, ahora.slice(0, 10));

  return await listarHorarios(idPelicula, dia, ahora);
}

// Datos de la función, mapa de asientos y tipos de boleto
export async function consultarAsientos(idProyeccion) {
  validarId(idProyeccion, 'la función');

  const proyeccion = await obtenerProyeccionVigente(idProyeccion, ahoraCostaRica());
  if (!proyeccion) {
    throw new ErrorNoEncontrado('La función no existe o ya no está disponible');
  }

  const [asientos, tiposBoleto] = await Promise.all([listarAsientos(idProyeccion), listarTiposBoleto()]);

  return { proyeccion, asientos, tiposBoleto };
}

// Confirma que la selección se puede comprar en este momento.
// No reserva nada; la garantía final contra la doble venta es el UNIQUE de DETALLES_FACTURA.
export async function verificarSeleccion(idProyeccion, datos) {
  validarId(idProyeccion, 'la función');

  const asientos = validarAsientos(datos?.asientos);
  const boletos = validarBoletos(datos?.boletos);

  const cantidadBoletos = boletos.reduce((suma, { cantidad }) => suma + cantidad, 0);
  if (asientos.length < cantidadBoletos) {
    throw new ErrorValidacion(MENSAJE_FALTAN_ASIENTOS);
  }
  if (asientos.length > cantidadBoletos) {
    throw new ErrorValidacion('Seleccionaste más asientos que boletos');
  }

  const proyeccion = await obtenerProyeccionVigente(idProyeccion, ahoraCostaRica());
  if (!proyeccion) {
    throw new ErrorNoEncontrado('La función no existe o ya no está disponible');
  }

  const tiposBoleto = await listarTiposBoleto();
  const precios = new Map(tiposBoleto.map(([idTipoBoleto, , precio]) => [idTipoBoleto, precio]));
  if (!boletos.every(({ idTipoBoleto }) => precios.has(idTipoBoleto))) {
    throw new ErrorValidacion('El tipo de boleto no es válido');
  }

  const asientosDeSala = await contarAsientosDeSala(idProyeccion, asientos);
  if (asientosDeSala !== asientos.length) {
    throw new ErrorValidacion('Algún asiento no pertenece a la sala de la función');
  }

  const ocupados = await listarAsientosOcupados(idProyeccion, asientos);
  if (ocupados.length > 0) {
    throw new ErrorConflicto(MENSAJE_ASIENTO_NO_DISPONIBLE);
  }

  const total = boletos.reduce((suma, { idTipoBoleto, cantidad }) => suma + precios.get(idTipoBoleto) * cantidad, 0);

  return { total };
}
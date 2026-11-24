import { ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { ErrorConflicto } from '../errores/ErrorConflicto.js';
import { ErrorNoAutenticado } from '../errores/ErrorNoAutenticado.js';
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
import {
  MINUTOS_RESERVA,
  RESTRICCION_ASIENTO_RESERVADO,
  borrarReservaCliente,
  borrarReservasVencidas,
  insertarReserva,
  obtenerReservaCliente,
} from '../repositorios/repositorioReservaAsientos.js';
import { ahoraCostaRica } from '../utilidades/fechas.js';
import { obtenerUrlImagen } from './almacenamientoImagenes.js';

export const MENSAJE_ASIENTO_NO_DISPONIBLE =
  'El asiento seleccionado ya no está disponible. Por favor, elige otro.';
export const MENSAJE_FALTAN_ASIENTOS = 'Te faltan asientos por seleccionar';
export const MENSAJE_RESERVA_VENCIDA =
  'Tu tiempo para pagar terminó y los asientos se liberaron. Vuelve a elegir tus asientos.';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Regla de negocio: toda película en un idioma distinto del español se proyecta subtitulada al español.
const IDIOMA_LOCAL = 'Español';

const POSICION_MONTO_SALA = 6;

const CODIGO_ORACLE_DUPLICADO = 1;

function esSubtitulada(idiomas) {
  return idiomas.some((nombre) => nombre !== IDIOMA_LOCAL);
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

// Precio de cada tipo de boleto en una sala: el monto de la sala menos el descuento del tipo y, si la función
// tiene una oferta, menos el de la oferta. Los porcentajes se suman (con tope de 100%) y el precio se redondea al colón.
// [[id, nombre, descuento %]] → [[id, nombre, precio]] (lo que recibe el cliente)
export function calcularPrecios(tiposBoleto, montoSala, oferta = null) {
  const porcentajeOferta = oferta?.porcentaje ?? 0;
  return tiposBoleto.map(([idTipoBoleto, nombre, descuento]) => [
    idTipoBoleto,
    nombre,
    Math.round((montoSala * (100 - Math.min(100, descuento + porcentajeOferta))) / 100),
  ]);
}

// Los mismos precios por id, para la compra: monto a cobrar y descuento en colones
// (lo que va en MONTO y DESCUENTO de DETALLES_FACTURA). monto + descuento = monto de la sala.
// Con oferta también lleva su idDescuento, para dejarlo en el detalle de factura.
export function mapaPrecios(tiposBoleto, montoSala, oferta = null) {
  return new Map(
    calcularPrecios(tiposBoleto, montoSala, oferta).map(([idTipoBoleto, , precio]) => [
      idTipoBoleto,
      { monto: precio, descuento: montoSala - precio, ...(oferta ? { idDescuento: oferta.idDescuento } : {}) },
    ])
  );
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

// Datos de la función, mapa de asientos y tipos de boleto con su precio en esa sala
export async function consultarAsientos(idProyeccion) {
  validarId(idProyeccion, 'la función');

  const proyeccion = await obtenerProyeccionVigente(idProyeccion, ahoraCostaRica());
  if (!proyeccion) {
    throw new ErrorNoEncontrado('La función no existe o ya no está disponible');
  }

  const [asientos, tiposBoleto, oferta] = await Promise.all([
    listarAsientos(idProyeccion),
    listarTiposBoleto(),
    buscarOfertaDeProyeccion(idProyeccion),
  ]);

  return { proyeccion, asientos, tiposBoleto: calcularPrecios(tiposBoleto, proyeccion[POSICION_MONTO_SALA], oferta) };
}

// Solo revisa, no reserva. idCliente: su propia reserva no cuenta como ocupada (ver listarAsientosOcupados).
// Las garantías contra la doble venta son la PK de RESERVAS_ASIENTOS y el UNIQUE de DETALLES_FACTURA.
export async function validarSeleccion(idProyeccion, datos, idCliente) {
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

  const oferta = await buscarOfertaDeProyeccion(idProyeccion);
  const precios = mapaPrecios(await listarTiposBoleto(), proyeccion[POSICION_MONTO_SALA], oferta);
  if (!boletos.every(({ idTipoBoleto }) => precios.has(idTipoBoleto))) {
    throw new ErrorValidacion('El tipo de boleto no es válido');
  }

  const asientosDeSala = await contarAsientosDeSala(idProyeccion, asientos);
  if (asientosDeSala !== asientos.length) {
    throw new ErrorValidacion('Algún asiento no pertenece a la sala de la función');
  }

  const ocupados = await listarAsientosOcupados(idProyeccion, asientos, idCliente);
  if (ocupados.length > 0) {
    throw new ErrorConflicto(MENSAJE_ASIENTO_NO_DISPONIBLE);
  }

  const total = boletos.reduce(
    (suma, { idTipoBoleto, cantidad }) => suma + precios.get(idTipoBoleto).monto * cantidad,
    0
  );

  return { proyeccion, asientos, boletos, precios, total };
}

// Reserva temporal de asientos

// Los tokens emitidos antes de agregar idCliente (y los del personal) no sirven para reservar
export function obtenerIdCliente(usuario) {
  const idCliente = usuario?.idCliente;
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ErrorNoAutenticado('Tu sesión no es válida para comprar. Inicia sesión de nuevo.');
  }
  return idCliente;
}

// Le asigna a cada asiento un tipo de boleto, en el orden en que llegaron:
// asientos [10, 11, 12] y boletos [{ 1, cantidad 2 }, { 2, cantidad 1 }] → 10 y 11 tipo 1, 12 tipo 2.
// Se devuelven ordenados por asiento: si dos clientes reservan asientos en común, los insertan
// en el mismo orden y no se bloquean mutuamente (deadlock).
export function repartirBoletos(asientos, boletos) {
  const tipos = boletos.flatMap(({ idTipoBoleto, cantidad }) => Array(cantidad).fill(idTipoBoleto));
  return asientos
    .map((idAsiento, indice) => ({ idAsiento, idTipoBoleto: tipos[indice] }))
    .sort((a, b) => a.idAsiento - b.idAsiento);
}

function esAsientoYaReservado(error) {
  return error?.errorNum === CODIGO_ORACLE_DUPLICADO && error.message?.includes(RESTRICCION_ASIENTO_RESERVADO);
}

// Botón Continuar: aparta los asientos por MINUTOS_RESERVA minutos.
// Si el cliente ya tenía una reserva (de esta u otra función), se reemplaza.
export async function crearReserva(usuario, idProyeccion, datos) {
  const idCliente = obtenerIdCliente(usuario);
  const { asientos, boletos, total } = await validarSeleccion(idProyeccion, datos, idCliente);
  const detalles = repartirBoletos(asientos, boletos);

  try {
    await ejecutarTransaccion(async (conexion) => {
      await borrarReservasVencidas(conexion, idProyeccion, asientos);
      await borrarReservaCliente(conexion, idCliente);
      await insertarReserva(conexion, idCliente, idProyeccion, detalles, MINUTOS_RESERVA);
    });
  } catch (error) {
    // Otro cliente apartó alguno de los asientos entre la validación y el INSERT
    if (esAsientoYaReservado(error)) throw new ErrorConflicto(MENSAJE_ASIENTO_NO_DISPONIBLE);
    throw error;
  }

  return { total, segundosRestantes: MINUTOS_RESERVA * 60 };
}

// Reserva vigente del cliente para la pantalla de pago, o null si no tiene o ya venció:
// { idProyeccion, asientos: [id], boletos: [{ idTipoBoleto, cantidad }], segundosRestantes }
export async function consultarReserva(usuario) {
  const idCliente = obtenerIdCliente(usuario);
  const filas = await obtenerReservaCliente(idCliente);
  if (filas.length === 0) return null;

  const cantidades = new Map();
  for (const [, , idTipoBoleto] of filas) {
    cantidades.set(idTipoBoleto, (cantidades.get(idTipoBoleto) ?? 0) + 1);
  }

  return {
    idProyeccion: filas[0][0],
    asientos: filas.map(([, idAsiento]) => idAsiento),
    boletos: [...cantidades].map(([idTipoBoleto, cantidad]) => ({ idTipoBoleto, cantidad })),
    segundosRestantes: Math.max(0, Math.min(...filas.map(([, , , segundos]) => segundos))),
  };
}

// Para la compra, en dos partes:
//   obtenerPreciosFuncion consulta la BD y va ANTES de abrir la transacción;
//   armarCompraReservada no toca la BD y va DENTRO, con las filas ya bloqueadas.
// Así la transacción no pide una segunda conexión al pool mientras tiene la suya: con varias
// compras a la vez, todas podrían quedarse esperando una conexión que nunca se libera.

// Precio de cada tipo de boleto en la función: Map idTipoBoleto → { monto, descuento }
export async function obtenerPreciosFuncion(idProyeccion) {
  const proyeccion = await obtenerProyeccionVigente(idProyeccion, ahoraCostaRica());
  if (!proyeccion) {
    throw new ErrorNoEncontrado('La función no existe o ya no está disponible');
  }
  return mapaPrecios(await listarTiposBoleto(), proyeccion[POSICION_MONTO_SALA]);
}

// filas: [[idAsiento, idTipoBoleto, ...]] (bloquearReservaCliente u obtenerReservaCliente ya adaptadas). Devuelve
// { asientos, boletos: [{ idTipoBoleto, cantidad }], detalles: [{ idAsiento, idTipoBoleto, monto, descuento }], total }
export function armarCompraReservada(filas, precios) {
  if (!filas.every(([, idTipoBoleto]) => precios.has(idTipoBoleto))) {
    throw new ErrorValidacion('El tipo de boleto no es válido');
  }

  const detalles = filas.map(([idAsiento, idTipoBoleto]) => ({ idAsiento, idTipoBoleto, ...precios.get(idTipoBoleto) }));

  const cantidades = new Map();
  for (const { idTipoBoleto } of detalles) {
    cantidades.set(idTipoBoleto, (cantidades.get(idTipoBoleto) ?? 0) + 1);
  }

  return {
    asientos: detalles.map(({ idAsiento }) => idAsiento),
    boletos: [...cantidades].map(([idTipoBoleto, cantidad]) => ({ idTipoBoleto, cantidad })),
    detalles,
    total: detalles.reduce((suma, { monto }) => suma + monto, 0),
  };
}

// Botón Volver en la pantalla de pago: libera los asientos. No falla si no había reserva.
export async function cancelarReserva(usuario) {
  const idCliente = obtenerIdCliente(usuario);
  await ejecutarTransaccion((conexion) => borrarReservaCliente(conexion, idCliente));
}
import {
  listarSedesParaFiltro,
  peliculasMasVistas,
  recaudacionPorPelicula,
  ventasPorPeriodo,
} from '../repositorios/repositorioEstadistica.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { ahoraCostaRica } from '../utilidades/fechas.js';
import { idDeFiltro } from '../utilidades/validaciones.js';

const ANIOS_EN_VENTAS_ANUALES = 5;
const TRIMESTRES = [1, 2, 3, 4];
const ANIO_MINIMO = 2000;

const dosDigitos = (numero) => String(numero).padStart(2, '0');
const fechaTexto = (anio, mes, dia) => `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`;

function hoy() {
  const [anio, mes, dia] = ahoraCostaRica().slice(0, 10).split('-').map(Number);
  return { anio, mes, dia };
}

function validarAgrupacion(agrupar) {
  if (agrupar === undefined || agrupar === '') return 'trimestre';
  if (agrupar !== 'trimestre' && agrupar !== 'anio') throw new ErrorValidacion('La agrupación de ventas no es válida');
  return agrupar;
}

function validarAnio(valor, anioActual) {
  if (valor === undefined || valor === null || valor === '') return anioActual;

  const anio = Number(valor);
  if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > anioActual) {
    throw new ErrorValidacion('El año no es válido');
  }
  return anio;
}

export async function obtenerVentas({ agrupar, anio, idSede } = {}) {
  const agrupacion = validarAgrupacion(agrupar);
  const { anio: anioActual } = hoy();
  const anioConsultado = validarAnio(anio, anioActual);
  const sede = idDeFiltro(idSede, 'cine');

  const periodos =
    agrupacion === 'trimestre'
      ? TRIMESTRES.map((trimestre) => ({ clave: String(trimestre), etiqueta: `T${trimestre}` }))
      : Array.from({ length: ANIOS_EN_VENTAS_ANUALES }, (_, indice) => {
          const valorAnio = anioActual - (ANIOS_EN_VENTAS_ANUALES - 1) + indice;
          return { clave: String(valorAnio), etiqueta: String(valorAnio) };
        });

  const primerAnio = agrupacion === 'trimestre' ? anioConsultado : Number(periodos[0].clave);
  const ultimoAnio = agrupacion === 'trimestre' ? anioConsultado : anioActual;

  const filas = await ventasPorPeriodo({
    agrupacion,
    desde: fechaTexto(primerAnio, 1, 1),
    hasta: fechaTexto(ultimoAnio + 1, 1, 1),
    idSede: sede,
  });

  // Un periodo sin ventas no viene de la base de datos: se completa con ceros
  const porPeriodo = new Map(filas.map(([periodo, ingresos, boletos]) => [String(periodo), [Number(ingresos), Number(boletos)]]));
  return periodos.map(({ clave, etiqueta }) => [etiqueta, ...(porPeriodo.get(clave) ?? [0, 0])]);
}

const PERIODOS_PELICULAS = ['semana', 'mes', 'trimestre', 'anio'];
const PERIODOS_RECAUDACION = ['semana', 'mes', 'anio'];

// Inicio (inclusive) y fin (exclusive) del periodo actual, como 'AAAA-MM-DD'.
// La semana empieza el lunes.
function limitesDelPeriodo(periodo, { anio, mes, dia }) {
  if (periodo === 'anio') return { desde: fechaTexto(anio, 1, 1), hasta: fechaTexto(anio + 1, 1, 1) };

  if (periodo === 'trimestre') {
    const primerMes = Math.floor((mes - 1) / 3) * 3 + 1;
    return {
      desde: fechaTexto(anio, primerMes, 1),
      hasta: primerMes + 3 > 12 ? fechaTexto(anio + 1, 1, 1) : fechaTexto(anio, primerMes + 3, 1),
    };
  }

  if (periodo === 'mes') {
    return { desde: fechaTexto(anio, mes, 1), hasta: mes === 12 ? fechaTexto(anio + 1, 1, 1) : fechaTexto(anio, mes + 1, 1) };
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const diasDesdeElLunes = (fecha.getUTCDay() + 6) % 7;
  const lunes = new Date(fecha.getTime() - diasDesdeElLunes * 86400000);
  const siguienteLunes = new Date(lunes.getTime() + 7 * 86400000);
  const aTexto = (valor) => fechaTexto(valor.getUTCFullYear(), valor.getUTCMonth() + 1, valor.getUTCDate());
  return { desde: aTexto(lunes), hasta: aTexto(siguienteLunes) };
}

function condicionesDelRanking({ periodo, idSede }, periodosPermitidos) {
  const periodoElegido = periodo === undefined || periodo === '' ? 'mes' : periodo;
  if (!periodosPermitidos.includes(periodoElegido)) throw new ErrorValidacion('El periodo no es válido');

  const sede = idDeFiltro(idSede, 'cine');
  return { ...limitesDelPeriodo(periodoElegido, hoy()), idSede: sede };
}

export async function obtenerPeliculasMasVistas({ periodo, idSede } = {}) {
  const filas = await peliculasMasVistas(condicionesDelRanking({ periodo, idSede }, PERIODOS_PELICULAS));
  return filas.map(([idPelicula, titulo, boletos, totalBoletos]) => [idPelicula, titulo, Number(boletos), Number(totalBoletos)]);
}

export async function obtenerRecaudacionPorPelicula({ periodo, idSede } = {}) {
  const filas = await recaudacionPorPelicula(condicionesDelRanking({ periodo, idSede }, PERIODOS_RECAUDACION));
  return filas.map(([idPelicula, titulo, ingresos, boletos, totalIngresos]) => [
    idPelicula,
    titulo,
    Number(ingresos),
    Number(boletos),
    Number(totalIngresos),
  ]);
}

export async function obtenerSedesParaFiltro() {
  return await listarSedesParaFiltro();
}
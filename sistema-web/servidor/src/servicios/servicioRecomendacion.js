import { puntajesDePeliculas } from '../repositorios/repositorioRecomendacion.js';
import { consultarCartelera } from './servicioCartelera.js';

const POS_ID_PELICULA = 0;

// Dos puntajes que difieren solo por los decimales finales de Oracle son el mismo puntaje (empate)
const DECIMALES_DEL_PUNTAJE = 1e6;
const redondear = (puntaje) => Math.round(puntaje * DECIMALES_DEL_PUNTAJE) / DECIMALES_DEL_PUNTAJE;

// Solo un cliente con una sesión válida tiene perfil; para el resto idCliente es null
function idDelCliente(usuario) {
  if (usuario?.tipoUsuario !== 'CLIENTE') return null;
  return Number.isInteger(usuario.idCliente) && usuario.idCliente > 0 ? usuario.idCliente : null;
}

// Películas de la cartelera del cine, en el mismo formato que la cartelera, de la que más a la que menos le gustaría
// al cliente. Solo entran las que tienen puntaje; si empatan, queda primero la de la cartelera (orden por título).
// Sin sesión, sin compras o sin ninguna coincidencia se devuelve la cartelera completa, sin cálculo.
export async function consultarRecomendaciones(usuario, idSede) {
  const cartelera = await consultarCartelera(idSede);

  const idCliente = idDelCliente(usuario);
  if (idCliente === null) return cartelera;

  const puntajes = new Map(
    (await puntajesDePeliculas(idCliente)).map(([idPelicula, puntaje]) => [Number(idPelicula), redondear(Number(puntaje))]),
  );
  const puntajeDe = (pelicula) => puntajes.get(pelicula[POS_ID_PELICULA]) ?? 0;

  const recomendadas = cartelera.filter((pelicula) => puntajeDe(pelicula) > 0).sort((a, b) => puntajeDe(b) - puntajeDe(a));

  return recomendadas.length > 0 ? recomendadas : cartelera;
}
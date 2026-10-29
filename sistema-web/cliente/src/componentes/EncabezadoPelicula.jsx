import { POS_PELICULA_CARTELERA } from '../constantes/posicionesReserva.js';
import ContenedorCliente from './ContenedorCliente.jsx';

function EncabezadoPelicula({ detalle }) {
  const pelicula = detalle.pelicula;
  const urlBanner = pelicula[POS_PELICULA_CARTELERA.urlBanner];
  const urlPoster = pelicula[POS_PELICULA_CARTELERA.urlPoster];
  const titulo = pelicula[POS_PELICULA_CARTELERA.titulo];

  // "155 m | Subtitulada | PG | 2D | 3D"
  const datos = [
    `${pelicula[POS_PELICULA_CARTELERA.duracion]} m`,
    detalle.subtitulada ? 'Subtitulada' : null,
    pelicula[POS_PELICULA_CARTELERA.clasificacion],
    ...detalle.formatos,
  ].filter(Boolean);

  return (
    // -mt-28 sube el encabezado detrás de la barra de navegación, que es sticky y flota encima
    <header className="relative -mt-28 overflow-hidden bg-surface pt-36 pb-10">
      {urlBanner && (
        <img src={urlBanner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" aria-hidden="true" />

      <ContenedorCliente className="relative flex flex-col sm:flex-row gap-8 text-text-color">
        <div className="w-40 aspect-[2/3] shrink-0 rounded-md overflow-hidden bg-surface border border-border">
          {urlPoster ? (
            <img src={urlPoster} alt={`Póster de ${titulo}`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center p-2 text-center text-sm text-text-muted">
              Sin póster
            </div>
          )}
        </div>

        <div className="max-w-2xl flex flex-col gap-3">
          <h1 className="text-3xl font-bold">{titulo}</h1>

          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            {datos.map((dato, indice) => (
              <span key={dato} className="flex items-center gap-2">
                {indice > 0 && <span className="h-4 w-0.5 bg-text-color" aria-hidden="true" />}
                {dato}
              </span>
            ))}
          </p>

          {detalle.generos.length > 0 && <p>{detalle.generos.join(', ')}.</p>}

          <p className="text-sm leading-relaxed text-white/80">{pelicula[POS_PELICULA_CARTELERA.sinopsis]}</p>
        </div>
      </ContenedorCliente>
    </header>
  );
}

export default EncabezadoPelicula;
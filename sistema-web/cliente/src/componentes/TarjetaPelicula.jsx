import { Link } from 'react-router-dom';
import { POS_PELICULA_CARTELERA as POS } from '../constantes/posicionesCartelera.js';

function TarjetaPelicula({ pelicula, idSede }) {
  const titulo = pelicula[POS.titulo];
  const urlPortada = pelicula[POS.urlPortada];

  return (
    <Link
      to={`/cartelera/${pelicula[POS.id]}?sede=${idSede}`}
      className="group flex flex-col gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-soft"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-md border border-border bg-surface">
        {urlPortada ? (
          <img
            src={urlPortada}
            alt={`Póster de ${titulo}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-sm text-text-muted">
            Sin póster
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-color">{titulo}</h3>
        <p className="text-xs text-text-color/70">{pelicula[POS.clasificacion]}</p>
        <p className="text-xs text-text-color/70">{pelicula[POS.duracion]} minutos</p>
      </div>
    </Link>
  );
}

export default TarjetaPelicula;

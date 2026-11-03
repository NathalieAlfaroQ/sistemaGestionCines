import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { POS_PELICULA_CARTELERA as POS } from '../constantes/posicionesCartelera.js';

const INTERVALO_MS = 5000;

const claseFlecha = 'absolute top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-text-color transition-colors hover:bg-black/40 focus-visible:bg-black/40 focus-visible:outline-2 focus-visible:outline-text-color';

function Flecha({ lado, alPulsar }) {
  const anterior = lado === 'anterior';

  return (
    <button
      type="button"
      onClick={alPulsar}
      aria-label={anterior ? 'Película anterior' : 'Película siguiente'}
      className={`${claseFlecha} ${anterior ? 'left-4 md:left-10' : 'right-4 md:right-10'}`}
    >
      <svg className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={anterior ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

function prefiereMenosMovimiento() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function CarruselPeliculas({ peliculas, idSede, children }) {
  const [indice, setIndice] = useState(0);
  const [mouseEncima, setMouseEncima] = useState(false);
  const [focoDeTeclado, setFocoDeTeclado] = useState(false);
  const pausado = mouseEncima || focoDeTeclado;

  const total = peliculas.length;
  const actual = total > 0 ? indice % total : 0;

  useEffect(() => {
    if (total < 2 || pausado || prefiereMenosMovimiento()) return undefined;

    const temporizador = setInterval(() => setIndice((anterior) => (anterior + 1) % total), INTERVALO_MS);
    return () => clearInterval(temporizador);
  }, [total, pausado]);

  const irA = (posicion) => setIndice((posicion + total) % total);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Películas en cartelera"
      onMouseEnter={() => setMouseEncima(true)}
      onMouseLeave={() => setMouseEncima(false)}
      onFocus={(evento) => setFocoDeTeclado(evento.target.matches(':focus-visible'))}
      onBlur={() => setFocoDeTeclado(false)}
      className="relative -mt-28 h-[30rem] overflow-hidden bg-surface md:h-[36rem]"
    >
      {peliculas.map((pelicula, posicion) => {
        const activa = posicion === actual;

        return (
          <Link
            key={pelicula[POS.id]}
            to={`/cartelera/${pelicula[POS.id]}?sede=${idSede}`}
            aria-label={`Comprar boletos de ${pelicula[POS.titulo]}`}
            aria-hidden={!activa}
            tabIndex={activa ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${activa ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <img src={pelicula[POS.urlCarrusel]} alt="" className="h-full w-full object-cover" />
          </Link>
        );
      })}

      {/* */}
      <div className="pointer-events-none absolute inset-0 bg-black/50" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-20 text-center">
        {children}
      </div>

      {total > 1 && (
        <>
          <Flecha lado="anterior" alPulsar={() => irA(actual - 1)} />
          <Flecha lado="siguiente" alPulsar={() => irA(actual + 1)} />
        </>
      )}
    </section>
  );
}

export default CarruselPeliculas;

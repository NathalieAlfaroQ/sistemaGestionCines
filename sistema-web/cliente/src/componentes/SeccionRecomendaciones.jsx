import { useState } from 'react';
import { POS_PELICULA_CARTELERA as POS_PELICULA } from '../constantes/posicionesCartelera.js';
import { useRecomendaciones } from '../ganchos/useRecomendaciones.js';
import ErrorCarga from './ErrorCarga.jsx';
import TarjetaPelicula from './TarjetaPelicula.jsx';

const CANTIDAD_INICIAL = 6;

// Se coloca con key={idSede} para que al cambiar de cine vuelva a mostrar solo las primeras
function SeccionRecomendaciones({ idSede }) {
  const { peliculas, cargando, error, recargar } = useRecomendaciones(idSede);
  const [verTodas, setVerTodas] = useState(false);

  if (idSede === '') return null;

  const visibles = verTodas ? peliculas : peliculas.slice(0, CANTIDAD_INICIAL);
  const hayMas = !verTodas && peliculas.length > CANTIDAD_INICIAL;

  function contenido() {
    if (error) return <ErrorCarga error={error} alReintentar={recargar} />;
    if (cargando) return <p className="text-text-color">Cargando recomendaciones...</p>;
    if (peliculas.length === 0) return <p className="text-text-color">No hay películas para recomendar por el momento.</p>;

    return (
      <>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {visibles.map((pelicula) => (
            <li key={pelicula[POS_PELICULA.id]}>
              <TarjetaPelicula pelicula={pelicula} idSede={idSede} />
            </li>
          ))}
        </ul>

        {hayMas && (
          <button
            type="button"
            onClick={() => setVerTodas(true)}
            className="self-center rounded-md bg-brand px-6 py-2 text-sm text-text-color hover:bg-brand-hover"
          >
            Ver más
          </button>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="titulo-recomendaciones" className="flex flex-col gap-6">
      <h2 id="titulo-recomendaciones" className="text-xl font-bold text-text-color">
        RECOMENDACIONES
      </h2>
      {contenido()}
    </section>
  );
}

export default SeccionRecomendaciones;

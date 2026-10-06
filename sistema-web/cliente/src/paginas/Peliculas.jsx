import { useState } from 'react';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { useNavigate } from 'react-router-dom';
import { usePaginacion } from '../ganchos/usePaginacion.js';
import Paginacion from '../componentes/Paginacion.jsx';
import TablaPeliculas from '../componentes/TablaPeliculas.jsx';



function Peliculas() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const { peliculas, cargando, error } = usePeliculas(busquedaRetrasada);
  const navegar = useNavigate();
  const paginacion = usePaginacion(peliculas, busquedaRetrasada);

  return (
    <main className="min-h-screen bg-fondo text-white">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-5">
          <h1 className="text-4xl font-bold">Películas</h1>

          <button
            type="button"
            onClick={() => navegar('/peliculas/nueva')}
            className="px-5 py-2.5 flex items-center gap-2 rounded-lg bg-boton text-sm font-medium text-white hover:brightness-125"
          >
            Crear película
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <input
          type="search"
          className="mb-12 w-85 px-4 py-2 rounded-lg bg-white text-black placeholder:text-gray-500"
          placeholder="Buscar películas"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="text-white">Cargando películas...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!cargando && !error && (
          <>
            <TablaPeliculas peliculas={paginacion.visibles} numeroInicial={paginacion.desde} />
            <Paginacion
              paginaActual={paginacion.paginaActual}
              totalPaginas={paginacion.totalPaginas}
              desde={paginacion.desde}
              hasta={paginacion.hasta}
              total={paginacion.total}
              tamano={paginacion.tamano}
              alCambiarPagina={paginacion.cambiarPagina}
              alCambiarTamano={paginacion.cambiarTamano}
            />
          </>
        )}
      </div>
    </main>
  );
}

export default Peliculas;
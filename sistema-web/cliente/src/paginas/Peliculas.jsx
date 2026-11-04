import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { borrarPelicula } from '../servicios/servicioPeliculas.js';
import { useNotificaciones } from '../ganchos/useNotificaciones.js';
import Tabla from '../common/Tabla.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';
import ModalConfirmacion from '../common/ModalConfirmacion.jsx';

const claseBoton = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover';
const claseBarraBusqueda = 'mb-4 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-black placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft';

const columnas = [
  { titulo: 'Título', posicion: POS_PELICULA.titulo },
  { titulo: 'Género', posicion: POS_PELICULA.generos, formato: (valor) => valor ?? '—' },
  { titulo: 'Duración', posicion: POS_PELICULA.duracion, formato: (valor) => `${valor} min` },
  { titulo: 'Clasificación por edad', posicion: POS_PELICULA.clasificacion },
];

function Peliculas() {
  const navegar = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const { peliculas, cargando, error, recargar } = usePeliculas(busquedaRetrasada);
  const [peliculaABorrar, setPeliculaABorrar] = useState(null);
  const notificaciones = useNotificaciones();

  function peliculaBorrada() {
    setPeliculaABorrar(null);
    notificaciones.exito('Película eliminada con éxito');
    recargar();
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-23">
          <h1 className="text-4xl font-bold">Películas</h1>

          <button type="button" onClick={() => navegar('/peliculas/nueva')} className={claseBoton}>
            Crear
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
          className={claseBarraBusqueda}
          placeholder="Buscar películas"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="mb-4 text-text-muted">Cargando películas...</p>}
        <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />

        {!error && (
          <Tabla
            columnas={columnas}
            filas={peliculas}
            posicionId={POS_PELICULA.id}
            textoVacio={cargando ? '' : 'No se encontraron películas'}
            onVer={(pelicula) => navegar(`/peliculas/${pelicula[POS_PELICULA.id]}`)}
            onEditar={(pelicula) => navegar(`/peliculas/${pelicula[POS_PELICULA.id]}/editar`)}
            onEliminar={setPeliculaABorrar}
          />
        )}
      </div>

      {peliculaABorrar && (
        <ModalConfirmacion
          peligrosa
          titulo="Eliminar película"
          mensaje={`¿Está seguro de que desea eliminar la película "${peliculaABorrar[POS_PELICULA.titulo]}"? Esta acción es permanente.`}
          textoConfirmar="Eliminar"
          textoProcesando="Eliminando..."
          alConfirmar={() => borrarPelicula(peliculaABorrar[POS_PELICULA.id])}
          alExito={peliculaBorrada}
          alCancelar={() => setPeliculaABorrar(null)}
        />
      )}
    </main>
  );
}

export default Peliculas;

import { useParams } from 'react-router-dom';
import { Button, Textarea, TextInput, ThemeProvider } from 'flowbite-react';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { usePelicula } from '../ganchos/usePelicula.js';
import { useVolver } from '../ganchos/useVolver.js';
import { POS_CATALOGO } from '../constantes/posicionesCatalogo.js';
import { POS_DETALLE_PELICULA } from '../constantes/posicionesDetallePelicula.js';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import { clasesFormulario, temaFormulario } from '../temas/temaFormulario.js';
import Campo from '../componentes/Campo.jsx';
import ListaEtiquetas from '../componentes/ListaEtiquetas.jsx';
import VistaImagen from '../componentes/VistaImagen.jsx';

const POSICION_URL = {
  poster: POS_DETALLE_PELICULA.urlPoster,
  banner: POS_DETALLE_PELICULA.urlBanner,
};

// Nombres de las opciones del catálogo cuyos ids están en la lista
function nombresDe(opciones, ids) {
  return opciones
    .filter((opcion) => ids.includes(opcion[POS_CATALOGO.id]))
    .map((opcion) => opcion[POS_CATALOGO.nombre]);
}

function BotonVolver({ alVolver }) {
  return (
    <Button type="button" color="brand" onClick={alVolver}>
      Volver
      <svg
        className="ml-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </Button>
  );
}

function VerPelicula() {
  const { id } = useParams();
  const volver = useVolver('/peliculas');
  const { detalle, cargando, error } = usePelicula(id);
  const { catalogo, cargando: cargandoCatalogo, error: errorCatalogo } = useCatalogo();

  if (cargando || cargandoCatalogo) {
    return <p className="p-8 text-white">Cargando película...</p>;
  }

  const mensajeError = error ?? errorCatalogo;
  if (mensajeError) {
    return (
      <div className="p-8">
        <p className={`mb-4 ${clasesFormulario.error}`}>{mensajeError}</p>
        <ThemeProvider theme={temaFormulario}>
          <BotonVolver alVolver={volver} />
        </ThemeProvider>
      </div>
    );
  }

  const pelicula = detalle.pelicula;

  return (
    <ThemeProvider theme={temaFormulario}>
      <main className={`min-h-[calc(100vh-6rem)] ${clasesFormulario.pagina}`}>
        <div className="max-w-screen-2xl mx-auto px-8 py-8">
          <h1 className="mb-8 text-3xl font-bold">Información de la película</h1>

          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-5">
              <Campo id="titulo" etiqueta="Título">
                <TextInput id="titulo" sizing="lg" readOnly value={pelicula[POS_DETALLE_PELICULA.titulo]} />
              </Campo>

              <Campo id="sinopsis" etiqueta="Sinopsis">
                <Textarea id="sinopsis" rows={6} readOnly value={pelicula[POS_DETALLE_PELICULA.sinopsis] ?? ''} />
              </Campo>

              <div className="flex flex-wrap items-start gap-4">
                <Campo id="duracion" etiqueta="Duración (minutos)" className="w-40">
                  <TextInput id="duracion" readOnly value={pelicula[POS_DETALLE_PELICULA.duracion]} />
                </Campo>

                <Campo id="clasificacion" etiqueta="Clasificación" className="w-40">
                  <TextInput id="clasificacion" readOnly value={pelicula[POS_DETALLE_PELICULA.clasificacion]} />
                </Campo>
              </div>

              <ListaEtiquetas etiqueta="Idioma" elementos={nombresDe(catalogo.idiomas, detalle.idiomas)} />
              <ListaEtiquetas etiqueta="Género" elementos={nombresDe(catalogo.generos, detalle.generos)} />
            </div>

            <div className="flex flex-wrap items-start gap-5">
              {TIPOS_IMAGEN.map(({ tipo, etiqueta, claseAncho, claseProporcion }) => (
                <VistaImagen
                  key={tipo}
                  etiqueta={etiqueta}
                  url={pelicula[POSICION_URL[tipo]]}
                  claseAncho={claseAncho}
                  claseProporcion={claseProporcion}
                />
              ))}
            </div>

            <div className="lg:col-span-2">
              <BotonVolver alVolver={volver} />
            </div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}

export default VerPelicula;
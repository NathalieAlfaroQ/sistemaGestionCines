import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ThemeProvider } from 'flowbite-react';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { useFormularioPelicula } from '../ganchos/useFormularioPelicula.js';
import { usePelicula } from '../ganchos/usePelicula.js';
import { useVolver } from '../ganchos/useVolver.js';
import { POS_DETALLE_PELICULA } from '../constantes/posicionesDetallePelicula.js';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import { actualizarPelicula, subirImagenesPelicula } from '../servicios/servicioPeliculas.js';
import { clasesFormulario, temaFormulario } from '../temas/temaFormulario.js';
import BotonVolver from '../componentes/BotonVolver.jsx';
import CamposPelicula from '../componentes/CamposPelicula.jsx';

const MENSAJE_EXITO = 'Película actualizada con éxito';
const MENSAJE_ERROR = 'Error al actualizar la película, intente después';
const TIEMPO_MENSAJE_MS = 1500;

function valoresDesde(detalle) {
  const pelicula = detalle.pelicula;

  return {
    titulo: pelicula[POS_DETALLE_PELICULA.titulo],
    sinopsis: pelicula[POS_DETALLE_PELICULA.sinopsis] ?? '',
    duracion: String(pelicula[POS_DETALLE_PELICULA.duracion]),
    clasificacion: pelicula[POS_DETALLE_PELICULA.clasificacion],
    generos: detalle.generos,
    idiomas: detalle.idiomas,
  };
}

function FormularioEdicion({ id, detalle, catalogo }) {
  const navegar = useNavigate();
  const volver = useVolver('/peliculas');
  const pelicula = detalle.pelicula;
  const urlsExistentes = {
    poster: pelicula[POS_DETALLE_PELICULA.urlPoster],
    banner: pelicula[POS_DETALLE_PELICULA.urlBanner],
  };
  const datos = useFormularioPelicula(valoresDesde(detalle), urlsExistentes);

  const [subidas, setSubidas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);

  // Tras el mensaje de éxito, vuelve a la lista
  useEffect(() => {
    if (!exito) return undefined;

    const temporizador = setTimeout(() => void navegar('/peliculas'), TIEMPO_MENSAJE_MS);
    return () => clearTimeout(temporizador);
  }, [exito, navegar]);

  function alCancelar() {
    datos.limpiar();
    volver();
  }

  async function alEnviar(evento) {
    evento.preventDefault();

    if (!datos.validarAlEnviar()) return;

    setGuardando(true);
    setError(null);

    try {
      await actualizarPelicula(id, datos.formulario);

      // Solo se suben las imágenes que se eligieron de nuevo
      const pendientes = {};
      for (const { tipo } of TIPOS_IMAGEN) {
        if (datos.imagenes[tipo] && !subidas.includes(tipo)) {
          pendientes[tipo] = datos.imagenes[tipo];
        }
      }

      const resultado = await subirImagenesPelicula(id, pendientes);
      setSubidas([...subidas, ...resultado.subidas]);
      datos.establecerErroresImagen(resultado.fallos);

      if (Object.keys(resultado.fallos).length === 0) {
        setExito(true);
      }
    } catch (error_) {
      console.error('Error al actualizar la película:', error_);
      setError(MENSAJE_ERROR);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ThemeProvider theme={temaFormulario}>
      <main className={`min-h-[calc(100vh-6rem)] ${clasesFormulario.pagina}`}>
        <div className="max-w-screen-2xl mx-auto px-8 py-8">
          <h1 className="mb-8 text-3xl font-bold">Editar película</h1>

          <form
            noValidate
            onSubmit={alEnviar}
            className="grid gap-x-12 gap-y-8 lg:grid-cols-2 lg:items-start"
          >
            <CamposPelicula
              datos={datos}
              catalogo={catalogo}
              urlsExistentes={urlsExistentes}
              subidas={subidas}
            />

            <div className="lg:col-span-2">
              {error && <p role="alert" className={`mb-4 ${clasesFormulario.error}`}>{error}</p>}
              {exito && <output className={`mb-4 block ${clasesFormulario.exito}`}>{MENSAJE_EXITO}</output>}
              <p className={`mb-4 text-sm ${clasesFormulario.acento}`}>* Espacio obligatorio</p>

              <div className="flex gap-4">
                <Button type="submit" color="brand" disabled={guardando || exito}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Button>

                <Button type="button" color="brand" disabled={guardando || exito} onClick={alCancelar}>
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </ThemeProvider>
  );
}

function EditarPelicula() {
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
        <BotonVolver alVolver={volver} />
      </div>
    );
  }

  return <FormularioEdicion id={id} detalle={detalle} catalogo={catalogo} />;
}

export default EditarPelicula;
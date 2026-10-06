import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, Textarea, TextInput, ThemeProvider } from 'flowbite-react';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { crearPelicula, subirImagenesPelicula } from '../servicios/servicioPeliculas.js';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import { clasesFormulario, temaFormulario } from '../temas/temaFormulario.js';
import Campo from '../componentes/Campo.jsx';
import SeleccionMultiple from '../componentes/SeleccionMultiple.jsx';
import SelectorImagen from '../componentes/SelectorImagen.jsx';

const claseImagenes = 'flex flex-wrap items-start gap-5';

function FormularioPelicula() {
  const navegar = useNavigate();
  const { catalogo, cargando: cargandoCatalogo, error: errorCatalogo } = useCatalogo();

  const [formulario, setFormulario] = useState({
    titulo: '',
    sinopsis: '',
    duracion: '',
    clasificacion: '',
    generos: [],
    idiomas: [],
  });

  const [imagenes, setImagenes] = useState({ poster: null, banner: null });
  const [idCreada, setIdCreada] = useState(null);
  const [subidas, setSubidas] = useState([]);
  const [erroresImagen, setErroresImagen] = useState({});

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const bloqueado = idCreada !== null;

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  // Devuelve value y onChange de un campo de texto, para no repetirlos en cada uno
  function enlazar(campo) {
    return {
      value: formulario[campo],
      onChange: (evento) => actualizar(campo, evento.target.value),
    };
  }

  function actualizarImagen(tipo, archivo) {
    setImagenes((anteriores) => ({ ...anteriores, [tipo]: archivo }));
    setErroresImagen((anteriores) => ({ ...anteriores, [tipo]: null }));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      let idPelicula = idCreada;

      if (idPelicula === null) {
        const creada = await crearPelicula(formulario);
        idPelicula = creada.idPelicula;
        setIdCreada(idPelicula);
      }

      const pendientes = {};
      for (const { tipo } of TIPOS_IMAGEN) {
        if (imagenes[tipo] && !subidas.includes(tipo)) {
          pendientes[tipo] = imagenes[tipo];
        }
      }

      const resultado = await subirImagenesPelicula(idPelicula, pendientes);
      setSubidas([...subidas, ...resultado.subidas]);
      setErroresImagen(resultado.fallos);

      if (Object.keys(resultado.fallos).length === 0) {
        void navegar('/peliculas');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoCatalogo) {
    return <p className="p-8 text-white">Cargando formulario...</p>;
  }

  if (errorCatalogo) {
    return <p className={`p-8 ${clasesFormulario.error}`}>{errorCatalogo}</p>;
  }

  let textoBoton = 'Guardar';
  if (guardando) textoBoton = 'Guardando...';
  else if (bloqueado) textoBoton = 'Reintentar subida';

  return (
    <ThemeProvider theme={temaFormulario}>
      <main className={`min-h-screen ${clasesFormulario.pagina}`}>
        <div className="max-w-screen-2xl mx-auto px-8 py-8">
          <h1 className="mb-8 text-3xl font-bold">Crear película</h1>

          <form
            onSubmit={alEnviar}
            className="grid gap-x-12 gap-y-8 lg:grid-cols-2 lg:items-start"
          >
            <fieldset disabled={bloqueado} className="contents">
              <div className="flex flex-col gap-5">
                <Campo id="titulo" etiqueta="Título" obligatorio>
                  <TextInput id="titulo" sizing="lg" maxLength={100} {...enlazar('titulo')} />
                </Campo>

                <Campo id="sinopsis" etiqueta="Sinopsis">
                  <Textarea id="sinopsis" rows={6} maxLength={500} {...enlazar('sinopsis')} />
                </Campo>

                <div className="flex flex-wrap gap-4">
                  <Campo id="duracion" etiqueta="Duración (minutos)" obligatorio>
                    <TextInput id="duracion" type="number" min="1" className="w-32" {...enlazar('duracion')} />
                  </Campo>

                  <Campo id="clasificacion" etiqueta="Clasificación" obligatorio>
                    <Select id="clasificacion" className="w-40" {...enlazar('clasificacion')}>
                      <option value="">Seleccione una</option>
                      {catalogo.clasificaciones.map((clasificacion) => (
                        <option key={clasificacion} value={clasificacion}>{clasificacion}</option>
                      ))}
                    </Select>
                  </Campo>
                </div>

                <SeleccionMultiple
                  etiqueta="Idioma"
                  textoVacio="Seleccione uno o más idiomas"
                  opciones={catalogo.idiomas}
                  seleccionados={formulario.idiomas}
                  alCambiar={(valor) => actualizar('idiomas', valor)}
                />

                <SeleccionMultiple
                  etiqueta="Género"
                  textoVacio="Seleccione uno o más géneros"
                  opciones={catalogo.generos}
                  seleccionados={formulario.generos}
                  alCambiar={(valor) => actualizar('generos', valor)}
                />
              </div>
            </fieldset>

            <div className={claseImagenes}>
              {TIPOS_IMAGEN.map(({ tipo, etiqueta, ayuda, claseAncho, claseProporcion }) => (
                <SelectorImagen
                  key={tipo}
                  id={`imagen-${tipo}`}
                  etiqueta={etiqueta}
                  ayuda={ayuda}
                  claseAncho={claseAncho}
                  claseProporcion={claseProporcion}
                  alCambiar={(archivo) => actualizarImagen(tipo, archivo)}
                  error={erroresImagen[tipo]}
                  subida={subidas.includes(tipo)}
                />
              ))}
            </div>

            <div className="lg:col-span-2">
              {error && <p className={`mb-4 ${clasesFormulario.error}`}>{error}</p>}
              {bloqueado && (
                <p className={`mb-4 ${clasesFormulario.aviso}`}>
                  La película ya se creó, pero alguna imagen no se pudo subir. Elija otra imagen
                  y presione &quot;Reintentar subida&quot;, o vuelva a la lista para dejarla sin ella.
                </p>
              )}
              <p className={`mb-4 text-sm ${clasesFormulario.acento}`}>* Espacio obligatorio</p>

              <div className="flex gap-4">
                <Button type="submit" color="brand" disabled={guardando}>
                  {textoBoton}
                </Button>

                <Button type="button" color="brand" onClick={() => navegar('/peliculas')}>
                  {bloqueado ? 'Volver a la lista' : 'Cancelar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </ThemeProvider>
  );
}

export default FormularioPelicula;
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Select, Textarea, TextInput, ThemeProvider } from 'flowbite-react';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { crearPelicula, subirImagenesPelicula } from '../servicios/servicioPeliculas.js';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import { validarTodo } from '../validaciones/validacionesPelicula.js';
import { clasesFormulario, temaFormulario } from '../temas/temaFormulario.js';
import Campo from '../componentes/Campo.jsx';
import MensajeError from '../componentes/MensajeError.jsx';
import SeleccionMultiple from '../componentes/SeleccionMultiple.jsx';
import SelectorImagen from '../componentes/SelectorImagen.jsx';

const MENSAJE_EXITO = 'Película creada con éxito';
const MENSAJE_ERROR = 'Error al crear la película, intente después';
const TIEMPO_MENSAJE_MS = 1500;

const FORMULARIO_INICIAL = {
  titulo: '',
  sinopsis: '',
  duracion: '',
  clasificacion: '',
  generos: [],
  idiomas: [],
};
const IMAGENES_INICIALES = { poster: null, banner: null };

// Disposición de los selectores de imagen. Dejá solo una de las dos líneas:
//   uno al lado del otro: 'flex flex-wrap items-start gap-5'
//   uno debajo del otro:  'flex flex-col gap-5'
const claseImagenes = 'flex flex-wrap items-start gap-5';

function FormularioPelicula() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { catalogo, cargando: cargandoCatalogo, error: errorCatalogo } = useCatalogo();

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [imagenes, setImagenes] = useState(IMAGENES_INICIALES);
  const [tocados, setTocados] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const [idCreada, setIdCreada] = useState(null);
  const [subidas, setSubidas] = useState([]);
  const [erroresImagen, setErroresImagen] = useState({});

  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);

  const bloqueado = idCreada !== null;
  const errores = validarTodo({ formulario, imagenes });

  // Tras el mensaje de éxito, vuelve a la lista
  useEffect(() => {
    if (!exito) return undefined;

    const temporizador = setTimeout(() => void navegar('/peliculas'), TIEMPO_MENSAJE_MS);
    return () => clearTimeout(temporizador);
  }, [exito, navegar]);

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  // El error de un campo solo se ve si ya se tocó el campo o si se intentó crear
  function errorVisible(campo) {
    return intentoEnvio || tocados[campo] ? (errores[campo] ?? null) : null;
  }

  // Devuelve las propiedades comunes de un campo de texto, para no repetirlas en cada uno
  function enlazar(campo) {
    return {
      value: formulario[campo],
      onChange: (evento) => actualizar(campo, evento.target.value),
      onBlur: () => marcarTocado(campo),
      color: errorVisible(campo) ? 'failure' : 'gray',
    };
  }

  function actualizarImagen(tipo, archivo) {
    setImagenes((anteriores) => ({ ...anteriores, [tipo]: archivo }));
    setErroresImagen((anteriores) => ({ ...anteriores, [tipo]: null }));
    marcarTocado(tipo);
  }

  function limpiar() {
    setFormulario(FORMULARIO_INICIAL);
    setImagenes(IMAGENES_INICIALES);
    setTocados({});
    setIntentoEnvio(false);
    setIdCreada(null);
    setSubidas([]);
    setErroresImagen({});
    setError(null);
  }

  function alCancelar() {
    limpiar();
    // "key" vale "default" si el formulario se abrió directamente, sin página anterior en la app
    void navegar(ubicacion.key === 'default' ? '/peliculas' : -1);
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setIntentoEnvio(true);

    // No se deja crear mientras haya algún campo vacío o con formato inválido
    if (Object.keys(errores).length > 0) return;

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
        setExito(true);
      }
    } catch (error) {
      console.error('Error al crear la película:', error);
      setError(MENSAJE_ERROR);
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

  let textoBoton = 'Crear';
  if (guardando) textoBoton = 'Creando...';
  else if (bloqueado) textoBoton = 'Reintentar subida';

  return (
    <ThemeProvider theme={temaFormulario}>
      <main className={`min-h-[calc(100vh-6rem)] ${clasesFormulario.pagina}`}>
        <div className="max-w-screen-2xl mx-auto px-8 py-8">
          <h1 className="mb-8 text-3xl font-bold">Crear película</h1>

          <form
            noValidate
            onSubmit={alEnviar}
            className="grid gap-x-12 gap-y-8 lg:grid-cols-2 lg:items-start"
          >
            <fieldset disabled={bloqueado} className="contents">
              <div className="flex flex-col gap-5">
                <Campo id="titulo" etiqueta="Título" obligatorio error={errorVisible('titulo')}>
                  <TextInput id="titulo" sizing="lg" maxLength={100} {...enlazar('titulo')} />
                </Campo>

                <Campo id="sinopsis" etiqueta="Sinopsis">
                  <Textarea id="sinopsis" rows={6} maxLength={500} {...enlazar('sinopsis')} />
                </Campo>

                <div className="flex flex-wrap items-start gap-4">
                  <Campo
                    id="duracion"
                    etiqueta="Duración (minutos)"
                    obligatorio
                    error={errorVisible('duracion')}
                    className="w-40"
                  >
                    <TextInput
                      id="duracion"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="000"
                      {...enlazar('duracion')}
                      onChange={(evento) => actualizar('duracion', evento.target.value.replace(/\D/g, ''))}
                    />
                  </Campo>

                  <Campo
                    id="clasificacion"
                    etiqueta="Clasificación"
                    obligatorio
                    error={errorVisible('clasificacion')}
                    className="w-40"
                  >
                    <Select id="clasificacion" {...enlazar('clasificacion')}>
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

                <div>
                  <SeleccionMultiple
                    etiqueta="Género"
                    textoVacio="Seleccione uno o más géneros"
                    opciones={catalogo.generos}
                    seleccionados={formulario.generos}
                    alCambiar={(valor) => {
                      actualizar('generos', valor);
                      marcarTocado('generos');
                    }}
                  />
                  <MensajeError mensaje={errorVisible('generos')} />
                </div>
              </div>
            </fieldset>

            <div className={claseImagenes}>
              {TIPOS_IMAGEN.map(({ tipo, etiqueta, ayuda, obligatoria, claseAncho, claseProporcion }) => (
                <SelectorImagen
                  key={tipo}
                  id={`imagen-${tipo}`}
                  etiqueta={etiqueta}
                  ayuda={ayuda}
                  obligatoria={obligatoria}
                  claseAncho={claseAncho}
                  claseProporcion={claseProporcion}
                  alCambiar={(archivo) => actualizarImagen(tipo, archivo)}
                  error={errorVisible(tipo) ?? erroresImagen[tipo]}
                  subida={subidas.includes(tipo)}
                />
              ))}
            </div>

            <div className="lg:col-span-2">
              {error && <p role="alert" className={`mb-4 ${clasesFormulario.error}`}>{error}</p>}
              {exito && <p role="status" className={`mb-4 ${clasesFormulario.exito}`}>{MENSAJE_EXITO}</p>}
              {bloqueado && !exito && (
                <p className={`mb-4 ${clasesFormulario.aviso}`}>
                  La película ya se creó, pero alguna imagen no se pudo subir. Elija otra imagen
                  y presione &quot;Reintentar subida&quot;, o vuelva a la lista para dejarla sin ella.
                </p>
              )}
              <p className={`mb-4 text-sm ${clasesFormulario.acento}`}>* Espacio obligatorio</p>

              <div className="flex gap-4">
                <Button type="submit" color="brand" disabled={guardando || exito}>
                  {textoBoton}
                </Button>

                <Button type="button" color="brand" disabled={guardando || exito} onClick={alCancelar}>
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
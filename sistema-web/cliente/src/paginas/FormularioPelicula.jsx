import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { crearPelicula, subirImagenesPelicula } from '../servicios/servicioPeliculas.js';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import SeleccionMultiple from '../componentes/SeleccionMultiple.jsx';
import SelectorImagen from '../componentes/SelectorImagen.jsx';

const claseEtiqueta = 'mb-2 block text-sm text-white';
const claseCampoBase = 'px-3 py-2 rounded-lg bg-black text-white placeholder:text-white/40';
const claseCampo = `w-full ${claseCampoBase}`;

// Disposición de los selectores de imagen. Dejá solo una de las dos líneas:
//   uno al lado del otro: 'grid max-w-xl gap-5 sm:grid-cols-2'
//   uno debajo del otro:  'grid max-w-xs gap-5'
const claseImagenes = 'grid max-w-xl gap-5 sm:grid-cols-2';

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
    return <p className="p-8 text-red-400">{errorCatalogo}</p>;
  }

  let textoBoton = 'Guardar';
  if (guardando) textoBoton = 'Guardando...';
  else if (bloqueado) textoBoton = 'Reintentar subida';

  return (
    <main className="min-h-screen bg-fondo text-white">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-8 text-3xl font-bold">Crear película</h1>

        <form
          onSubmit={alEnviar}
          className="grid gap-x-12 gap-y-8 lg:grid-cols-[28rem_1fr] lg:items-start"
        >
          <fieldset disabled={bloqueado} className="contents">
            <div className="flex flex-col gap-5">
              <div>
                <label htmlFor="titulo" className={claseEtiqueta}>
                  Título <span className="text-linea">*</span>
                </label>
                <input
                  id="titulo"
                  className={claseCampo}
                  maxLength={100}
                  value={formulario.titulo}
                  onChange={(evento) => actualizar('titulo', evento.target.value)}
                />
              </div>

              <div>
                <label htmlFor="sinopsis" className={claseEtiqueta}>Sinopsis</label>
                <textarea
                  id="sinopsis"
                  rows={4}
                  className={claseCampo}
                  maxLength={500}
                  value={formulario.sinopsis}
                  onChange={(evento) => actualizar('sinopsis', evento.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="duracion" className={claseEtiqueta}>
                    Duración (minutos) <span className="text-linea">*</span>
                  </label>
                  <input
                    id="duracion"
                    type="number"
                    min="1"
                    className={`${claseCampoBase} w-32`}
                    value={formulario.duracion}
                    onChange={(evento) => actualizar('duracion', evento.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="clasificacion" className={claseEtiqueta}>
                    Clasificación <span className="text-linea">*</span>
                  </label>
                  <select
                    id="clasificacion"
                    className={`${claseCampoBase} w-auto`}
                    value={formulario.clasificacion}
                    onChange={(evento) => actualizar('clasificacion', evento.target.value)}
                  >
                    <option value="">Seleccione una</option>
                    {catalogo.clasificaciones.map((clasificacion) => (
                      <option key={clasificacion} value={clasificacion}>{clasificacion}</option>
                    ))}
                  </select>
                </div>
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
            {TIPOS_IMAGEN.map(({ tipo, etiqueta, ayuda }) => (
              <SelectorImagen
                key={tipo}
                id={`imagen-${tipo}`}
                etiqueta={etiqueta}
                ayuda={ayuda}
                alCambiar={(archivo) => actualizarImagen(tipo, archivo)}
                error={erroresImagen[tipo]}
                subida={subidas.includes(tipo)}
              />
            ))}
          </div>

          <div className="lg:col-span-2">
            {error && <p className="mb-4 text-red-400">{error}</p>}
            {bloqueado && (
              <p className="mb-4 text-yellow-300">
                La película ya se creó, pero alguna imagen no se pudo subir. Elija otra imagen
                y presione &quot;Reintentar subida&quot;, o vuelva a la lista para dejarla sin ella.
              </p>
            )}
            <p className="mb-4 text-sm text-linea">* Espacio obligatorio</p>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2.5 rounded-lg bg-boton text-white hover:brightness-125 disabled:opacity-50"
              >
                {textoBoton}
              </button>

              <button
                type="button"
                onClick={() => navegar('/peliculas')}
                className="px-6 py-2.5 rounded-lg bg-boton text-white hover:brightness-125"
              >
                {bloqueado ? 'Volver a la lista' : 'Cancelar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default FormularioPelicula;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { crearPelicula } from '../servicios/servicioPeliculas.js';
import SeleccionMultiple from '../componentes/SeleccionMultiple.jsx';

const claseEtiqueta = 'mb-2 block text-sm text-white';
const claseCampo = 'w-full px-3 py-2 rounded-lg bg-black text-white placeholder:text-white/40';

function FormularioPelicula() {
  const navegar = useNavigate();
  const { catalogo, cargando: cargandoCatalogo } = useCatalogo();

  const [formulario, setFormulario] = useState({
    titulo: '',
    sinopsis: '',
    duracion: '',
    clasificacion: '',
    generos: [],
    idiomas: [],
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      await crearPelicula(formulario);
      void navegar('/peliculas');
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoCatalogo) {
    return <p className="p-8 text-white">Cargando formulario...</p>;
  }

  return (
    <main className="min-h-screen bg-fondo text-white">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-8 text-3xl font-bold">Crear película</h1>

        <form onSubmit={alEnviar} className="grid gap-8 md:grid-cols-2">
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
                rows={5}
                className={claseCampo}
                maxLength={500}
                value={formulario.sinopsis}
                onChange={(evento) => actualizar('sinopsis', evento.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="duracion" className={claseEtiqueta}>
                Duración (minutos) <span className="text-linea">*</span>
              </label>
              <input
                id="duracion"
                type="number"
                min="1"
                className={claseCampo}
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
                className={claseCampo}
                value={formulario.clasificacion}
                onChange={(evento) => actualizar('clasificacion', evento.target.value)}
              >
                <option value="">Seleccione una</option>
                {catalogo.clasificaciones.map((clasificacion) => (
                  <option key={clasificacion} value={clasificacion}>{clasificacion}</option>
                ))}
              </select>
            </div>

            <SeleccionMultiple
              etiqueta="Género"
              textoVacio="Seleccione uno o más géneros"
              opciones={catalogo.generos}
              seleccionados={formulario.generos}
              alCambiar={(valor) => actualizar('generos', valor)}
            />

            <SeleccionMultiple
              etiqueta="Idioma"
              textoVacio="Seleccione uno o más idiomas"
              opciones={catalogo.idiomas}
              seleccionados={formulario.idiomas}
              alCambiar={(valor) => actualizar('idiomas', valor)}
            />
          </div>

          <div className="md:col-span-2">
            {error && <p className="mb-4 text-red-400">{error}</p>}
            <p className="mb-4 text-sm text-linea">* Espacio obligatorio</p>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2.5 rounded-lg bg-boton text-white hover:brightness-125 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>

              <button
                type="button"
                onClick={() => navegar('/peliculas')}
                className="px-6 py-2.5 rounded-lg bg-boton text-white hover:brightness-125"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default FormularioPelicula;
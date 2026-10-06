import { Select, Textarea, TextInput } from 'flowbite-react';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import Campo from './Campo.jsx';
import MensajeError from './MensajeError.jsx';
import SeleccionMultiple from './SeleccionMultiple.jsx';
import SelectorImagen from './SelectorImagen.jsx';

const claseImagenes = 'flex flex-wrap items-start gap-5';

function CamposPelicula({ datos, catalogo, urlsExistentes = {}, subidas = [], bloqueado = false }) {
  const { formulario, erroresImagen, errorVisible, enlazar, actualizar, marcarTocado, actualizarImagen } = datos;

  return (
    <>
      <fieldset disabled={bloqueado} className="contents">
        <div className="flex flex-col gap-5">
          <Campo id="titulo" etiqueta="Título" obligatorio error={errorVisible('titulo')}>
            <TextInput id="titulo" sizing="lg" maxLength={100} {...enlazar('titulo')} />
          </Campo>

          <Campo id="sinopsis" etiqueta="Sinopsis" obligatorio error={errorVisible('sinopsis')}>
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

          <div>
            <SeleccionMultiple
              etiqueta="Idioma"
              textoVacio="Seleccione uno o más idiomas"
              opciones={catalogo.idiomas}
              seleccionados={formulario.idiomas}
              alCambiar={(valor) => {
                actualizar('idiomas', valor);
                marcarTocado('idiomas');
              }}
            />
            <MensajeError mensaje={errorVisible('idiomas')} />
          </div>

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
            urlExistente={urlsExistentes[tipo]}
            alCambiar={(archivo) => actualizarImagen(tipo, archivo)}
            error={errorVisible(tipo) ?? erroresImagen[tipo]}
            subida={subidas.includes(tipo)}
          />
        ))}
      </div>
    </>
  );
}

export default CamposPelicula;
import { Datepicker, ThemeProvider } from 'flowbite-react';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useSalas } from '../ganchos/useSalas.js';
import { useSedes } from '../ganchos/useSedes.js';
import { useFormularioProyeccion } from '../ganchos/useFormularioProyeccion.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { POS_SALA } from '../constantes/posicionesSala.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import { HORAS, MINUTOS, fechaATexto, hoyParaCalendario, horaATexto } from '../validaciones/validacionesProyeccion.js';
import { temaCalendario } from '../temas/temaCalendario.js';
import MensajeError from '../common/MensajeError.jsx';

const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseDesplegable = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseBotonConfirmar = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover disabled:opacity-50';

function Asterisco() {
  return <span className="text-danger">*</span>;
}

function FormularioProyeccion({
  valorInicial,
  textoGuardar = 'Guardar',
  alEnviar,
  alCancelar,
  guardando = false,
  error = null,
}) {
  const {
    formulario,
    hayCamposVacios,
    errorVisible,
    actualizar,
    enlazar,
    cambiarSede,
    marcarTocado,
    validarAlEnviar,
  } = useFormularioProyeccion(valorInicial);

  // Solo se pueden programar películas, cines y salas activos
  const { peliculas } = usePeliculas();
  const { sedes } = useSedes({ estado: 'activas' });
  const { salas } = useSalas({ idSede: formulario.idSede, estado: 'activas' });
  const salasDisponibles = formulario.idSede === '' ? [] : salas;

  const errorPelicula = errorVisible('idPelicula');
  const errorSede = errorVisible('idSede');
  const errorSala = errorVisible('idSala');
  const errorFecha = errorVisible('fecha');
  const errorHora = errorVisible('hora');

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarAlEnviar()) return;

    alEnviar({
      idPelicula: Number(formulario.idPelicula),
      idSala: Number(formulario.idSala),
      fecha: fechaATexto(formulario.fecha),
      hora: horaATexto(formulario),
    });
  }

  return (
    <form onSubmit={manejarEnvio} className="grid grid-cols-2 gap-x-4 gap-y-6">
      <div className="col-span-2">
        <label htmlFor="pelicula" className={claseEtiqueta}>
          Película <Asterisco />
        </label>
        <select
          id="pelicula"
          className={claseDesplegable}
          aria-invalid={errorPelicula !== null}
          aria-describedby={errorPelicula ? 'error-pelicula' : undefined}
          {...enlazar('idPelicula')}
        >
          <option value="" />
          {peliculas.map((pelicula) => (
            <option key={pelicula[POS_PELICULA.id]} value={pelicula[POS_PELICULA.id]}>
              {pelicula[POS_PELICULA.titulo]}
            </option>
          ))}
        </select>
        <MensajeError id="error-pelicula" mensaje={errorPelicula} />
      </div>

      <div>
        <label htmlFor="sede" className={claseEtiqueta}>
          Cine <Asterisco />
        </label>
        <select
          id="sede"
          className={claseDesplegable}
          aria-invalid={errorSede !== null}
          aria-describedby={errorSede ? 'error-sede' : undefined}
          value={formulario.idSede}
          onChange={(evento) => cambiarSede(evento.target.value)}
          onBlur={() => marcarTocado('idSede')}
        >
          <option value="" />
          {sedes.map((sede) => (
            <option key={sede[POS_SEDE.id]} value={sede[POS_SEDE.id]}>
              {sede[POS_SEDE.nombre]}
            </option>
          ))}
        </select>
        <MensajeError id="error-sede" mensaje={errorSede} />
      </div>

      <div>
        <label htmlFor="sala" className={claseEtiqueta}>
          Sala <Asterisco />
        </label>
        <select
          id="sala"
          className={claseDesplegable}
          aria-invalid={errorSala !== null}
          aria-describedby={errorSala ? 'error-sala' : undefined}
          disabled={formulario.idSede === ''}
          {...enlazar('idSala')}
        >
          <option value="" />
          {salasDisponibles.map((sala) => (
            <option key={sala[POS_SALA.id]} value={sala[POS_SALA.id]}>
              {sala[POS_SALA.nombre]}
            </option>
          ))}
        </select>
        <MensajeError id="error-sala" mensaje={errorSala} />
      </div>

      <div>
        <label htmlFor="fecha" className={claseEtiqueta}>
          Fecha <Asterisco />
        </label>
        <ThemeProvider theme={temaCalendario}>
          <Datepicker
            id="fecha"
            language="es"
            labelTodayButton="Hoy"
            labelClearButton="Limpiar"
            minDate={hoyParaCalendario()}
            value={formulario.fecha}
            onChange={(fecha) => actualizar('fecha', fecha)}
            label=""
            placeholder="DD/MM/AAAA"
            aria-invalid={errorFecha !== null}
            aria-describedby={errorFecha ? 'error-fecha' : undefined}
          />
        </ThemeProvider>
        <MensajeError id="error-fecha" mensaje={errorFecha} />
      </div>

      <div>
        <label htmlFor="hora" className={claseEtiqueta}>
          Hora <Asterisco />
        </label>
        <div className="flex items-center gap-2">
          <select
            id="hora"
            className={claseDesplegable}
            aria-label="Hora"
            aria-invalid={errorHora !== null}
            aria-describedby={errorHora ? 'error-hora' : undefined}
            value={formulario.hora}
            onChange={(evento) => actualizar('hora', evento.target.value)}
          >
            <option value="">HH</option>
            {HORAS.map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
          <span aria-hidden="true">:</span>
          <select
            id="minuto"
            className={claseDesplegable}
            aria-label="Minutos"
            aria-invalid={errorHora !== null}
            aria-describedby={errorHora ? 'error-hora' : undefined}
            value={formulario.minuto}
            onChange={(evento) => actualizar('minuto', evento.target.value)}
            onBlur={() => marcarTocado('hora')}
          >
            <option value="">MM</option>
            {MINUTOS.map((minuto) => (
              <option key={minuto} value={minuto}>
                {minuto}
              </option>
            ))}
          </select>
        </div>
        <MensajeError id="error-hora" mensaje={errorHora} />
      </div>

      <div className="col-span-2 flex flex-col gap-4">
        <MensajeError mensaje={error} className="mt-0" />

        {/* */}
        {hayCamposVacios && <p className="text-sm text-danger">* Espacio obligatorio</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={guardando} className={claseBotonConfirmar}>
            {guardando ? 'Guardando...' : textoGuardar}
          </button>

          <button type="button" onClick={alCancelar} className={claseBotonCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

export default FormularioProyeccion;

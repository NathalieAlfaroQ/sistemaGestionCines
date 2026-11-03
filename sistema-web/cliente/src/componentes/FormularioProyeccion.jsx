import { Datepicker, ThemeProvider } from 'flowbite-react';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useSalas } from '../ganchos/useSalas.js';
import { useSedes } from '../ganchos/useSedes.js';
import { useTareas } from '../ganchos/useTareas.js';
import { useFormularioProyeccion } from '../ganchos/useFormularioProyeccion.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { POS_SALA } from '../constantes/posicionesSala.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import { HORAS, MINUTOS, fechaATexto, hoyParaCalendario, horaATexto, minutosDeTareas } from '../validaciones/validacionesProyeccion.js';
import { temaCalendario } from '../temas/temaCalendario.js';
import { formatearDuracion } from '../utilidades/formatearDuracion.js';
import MensajeError from '../common/MensajeError.jsx';
import ErrorCarga from './ErrorCarga.jsx';
import { claseDesplegable, claseSoloLecturaEnModal } from '../constantes/clasesFormulario.js';
import Etiqueta from './Etiqueta.jsx';
import CampoSoloLectura from './CampoSoloLectura.jsx';
import SeccionTareas from './SeccionTareas.jsx';
import PieFormulario from './PieFormulario.jsx';

const claseDesplegableVacio = claseDesplegable.replace('text-text-color', 'text-text-muted') + ' [&>option]:text-text-color';
const claseDesplegableHora = (valor) => (valor === '' ? claseDesplegableVacio : claseDesplegable);


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
    elegirTareas,
    cambiarMinutos,
    marcarTocado,
    validarAlEnviar,
  } = useFormularioProyeccion(valorInicial);

  // Solo se pueden programar películas, cines y salas activos
  const { peliculas, error: errorPeliculas, recargar: recargarPeliculas } = usePeliculas();
  const { sedes, error: errorSedes, recargar: recargarSedes } = useSedes({ estado: 'activas' });
  const { salas, error: errorSalas, recargar: recargarSalas } = useSalas({ idSede: formulario.idSede, estado: 'activas' });
  const { tareas: catalogoTareas, error: errorTareas, recargar: recargarTareas } = useTareas();
  const errorCarga = errorPeliculas || errorSedes || errorSalas || errorTareas;

  function reintentarCarga() {
    if (errorPeliculas) recargarPeliculas();
    if (errorSedes) recargarSedes();
    if (errorSalas) recargarSalas();
    if (errorTareas) recargarTareas();
  }
  const salasDisponibles = formulario.idSede === '' ? [] : salas;

  const errorPelicula = errorVisible('idPelicula');
  const errorSede = errorVisible('idSede');
  const errorSala = errorVisible('idSala');
  const errorFecha = errorVisible('fecha');
  const errorHora = errorVisible('hora');
  const errorTareasFormulario = errorVisible('tareas');

  const pelicula = peliculas.find((fila) => String(fila[POS_PELICULA.id]) === formulario.idPelicula);
  const duracionTotal = pelicula ? pelicula[POS_PELICULA.duracion] + minutosDeTareas(formulario.tareas) : null;

  const horasOfrecidas = formulario.hora === '' || HORAS.includes(formulario.hora) ? HORAS : [...HORAS, formulario.hora].sort((a, b) => a.localeCompare(b));

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarAlEnviar()) return;

    alEnviar({
      idPelicula: Number(formulario.idPelicula),
      idSala: Number(formulario.idSala),
      fecha: fechaATexto(formulario.fecha),
      hora: horaATexto(formulario),
      tareas: formulario.tareas.map((tarea) => ({ idTarea: Number(tarea.idTarea), minutos: Number(tarea.minutos) })),
    });
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="grid grid-cols-2 gap-x-4 gap-y-6">
      {errorCarga && (
        <div className="col-span-2">
          <ErrorCarga error={errorCarga} alReintentar={reintentarCarga} />
        </div>
      )}

      <div className="col-span-2">
        <Etiqueta id="pelicula">Película</Etiqueta>
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
        <Etiqueta id="sede">Cine</Etiqueta>
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
        <Etiqueta id="sala">Sala</Etiqueta>
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
        <Etiqueta id="fecha">Fecha</Etiqueta>
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
        <Etiqueta id="hora">Hora</Etiqueta>
        <div className="flex items-center gap-2">
          <select
            id="hora"
            className={claseDesplegableHora(formulario.hora)}
            aria-label="Hora"
            aria-invalid={errorHora !== null}
            aria-describedby={errorHora ? 'error-hora' : undefined}
            value={formulario.hora}
            onChange={(evento) => actualizar('hora', evento.target.value)}
          >
            <option value="">HH</option>
            {horasOfrecidas.map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
          <span aria-hidden="true">:</span>
          <select
            id="minuto"
            className={claseDesplegableHora(formulario.minuto)}
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

      <div className="col-span-2">
        <SeccionTareas
          tareas={formulario.tareas}
          catalogo={catalogoTareas}
          error={errorTareasFormulario}
          alElegir={(ids) => {
            elegirTareas(ids);
            marcarTocado('tareas');
          }}
          alCambiarMinutos={cambiarMinutos}
          alTocar={() => marcarTocado('tareas')}
        />
      </div>

      <div className={`col-span-2 ${claseSoloLecturaEnModal}`}>
        <CampoSoloLectura
          id="duracion"
          etiqueta="Duración total (película y tareas)"
          valor={duracionTotal === null ? null : formatearDuracion(duracionTotal)}
        />
      </div>

      <PieFormulario
        className="col-span-2"
        error={error}
        hayCamposVacios={hayCamposVacios}
        guardando={guardando}
        textoGuardar={textoGuardar}
        alCancelar={alCancelar}
      />
    </form>
  );
}

export default FormularioProyeccion;

import { Datepicker, ThemeProvider } from 'flowbite-react';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useSedes } from '../ganchos/useSedes.js';
import { useFormularioDescuento } from '../ganchos/useFormularioDescuento.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import { MINUTOS, fechaATexto, horaATexto, hoyParaCalendario } from '../validaciones/validacionesProyeccion.js';
import { HORAS_DESCUENTO, NOMBRE_MAXIMO, porcentajeANumero } from '../validaciones/validacionesDescuento.js';
import { temaCalendario } from '../temas/temaCalendario.js';
import { claseCampo, claseDesplegable } from '../constantes/clasesFormulario.js';
import MensajeError from '../common/MensajeError.jsx';
import ErrorCarga from './ErrorCarga.jsx';
import Etiqueta from './Etiqueta.jsx';
import SeleccionMultiple from './SeleccionMultiple.jsx';
import PieFormulario from './PieFormulario.jsx';

const claseDesplegableVacio = claseDesplegable.replace('text-text-color', 'text-text-muted') + ' [&>option]:text-text-color';
const claseDesplegableHora = (valor) => (valor === '' ? claseDesplegableVacio : claseDesplegable);

// Fecha con calendario y hora (HH:MM) de un extremo del periodo: "inicio" o "fin"
function CampoMomento({ id, etiqueta, fecha, hora, minuto, error, alCambiar, alTocar }) {
  return (
    <div>
      <Etiqueta id={`fecha-${id}`}>{etiqueta}</Etiqueta>
      <ThemeProvider theme={temaCalendario}>
        <Datepicker
          id={`fecha-${id}`}
          language="es"
          labelTodayButton="Hoy"
          labelClearButton="Limpiar"
          minDate={hoyParaCalendario()}
          value={fecha}
          onChange={(nueva) => {
            alCambiar('fecha', nueva);
            alTocar();
          }}
          label=""
          placeholder="DD/MM/AAAA"
          aria-invalid={error !== null}
          aria-describedby={error ? `error-${id}` : undefined}
        />
      </ThemeProvider>

      <div className="mt-2 flex items-center gap-2">
        <select
          id={`hora-${id}`}
          className={claseDesplegableHora(hora)}
          aria-label={`Hora de ${id}`}
          aria-invalid={error !== null}
          value={hora}
          onChange={(evento) => alCambiar('hora', evento.target.value)}
        >
          <option value="">HH</option>
          {HORAS_DESCUENTO.map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
        <span aria-hidden="true">:</span>
        <select
          id={`minuto-${id}`}
          className={claseDesplegableHora(minuto)}
          aria-label={`Minutos de ${id}`}
          aria-invalid={error !== null}
          value={minuto}
          onChange={(evento) => alCambiar('minuto', evento.target.value)}
          onBlur={alTocar}
        >
          <option value="">MM</option>
          {MINUTOS.map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
      </div>
      <MensajeError id={`error-${id}`} mensaje={error} />
    </div>
  );
}

function FormularioDescuento({
  valorInicial,
  textoGuardar = 'Guardar',
  alEnviar,
  alCancelar,
  guardando = false,
  error = null,
}) {
  const { formulario, hayCamposVacios, errorVisible, actualizar, enlazar, marcarTocado, validarAlEnviar } =
    useFormularioDescuento(valorInicial);

  // Solo se pueden dar descuentos en cines y películas activos
  const { sedes, error: errorSedes, recargar: recargarSedes } = useSedes({ estado: 'activas' });
  const { peliculas, error: errorPeliculas, recargar: recargarPeliculas } = usePeliculas();
  const errorCarga = errorSedes || errorPeliculas;

  function reintentarCarga() {
    if (errorSedes) recargarSedes();
    if (errorPeliculas) recargarPeliculas();
  }

  const opcionesPeliculas = peliculas.map((pelicula) => [pelicula[POS_PELICULA.id], pelicula[POS_PELICULA.titulo]]);

  const errorNombre = errorVisible('nombre');
  const errorPorcentaje = errorVisible('porcentaje');
  const errorSede = errorVisible('idSede');
  const errorPeliculasElegidas = errorVisible('idsPeliculas');
  const errorInicio = errorVisible('inicio');
  const errorFin = errorVisible('fin');

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarAlEnviar()) return;

    alEnviar({
      nombre: formulario.nombre.trim(),
      idSede: Number(formulario.idSede),
      aplicaTodas: formulario.aplicaTodas,
      idsPeliculas: formulario.aplicaTodas ? [] : formulario.idsPeliculas,
      porcentaje: porcentajeANumero(formulario.porcentaje),
      fechaInicio: fechaATexto(formulario.fechaInicio),
      horaInicio: horaATexto({ hora: formulario.horaInicio, minuto: formulario.minutoInicio }),
      fechaFin: fechaATexto(formulario.fechaFin),
      horaFin: horaATexto({ hora: formulario.horaFin, minuto: formulario.minutoFin }),
    });
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="grid grid-cols-2 gap-x-4 gap-y-6">
      {errorCarga && (
        <div className="col-span-2">
          <ErrorCarga error={errorCarga} alReintentar={reintentarCarga} />
        </div>
      )}

      <div>
        <Etiqueta id="nombre">Nombre</Etiqueta>
        <input
          id="nombre"
          type="text"
          maxLength={NOMBRE_MAXIMO}
          className={claseCampo}
          aria-invalid={errorNombre !== null}
          aria-describedby={errorNombre ? 'error-nombre' : undefined}
          {...enlazar('nombre')}
        />
        <MensajeError id="error-nombre" mensaje={errorNombre} />
      </div>

      <div>
        <Etiqueta id="porcentaje">Porcentaje descuento</Etiqueta>
        <input
          id="porcentaje"
          type="text"
          inputMode="decimal"
          className={claseCampo}
          aria-invalid={errorPorcentaje !== null}
          aria-describedby={errorPorcentaje ? 'error-porcentaje' : undefined}
          {...enlazar('porcentaje')}
        />
        <MensajeError id="error-porcentaje" mensaje={errorPorcentaje} />
      </div>

      <div className="col-span-2">
        <Etiqueta id="sede">Cine</Etiqueta>
        <select
          id="sede"
          className={claseDesplegable}
          aria-invalid={errorSede !== null}
          aria-describedby={errorSede ? 'error-sede' : undefined}
          {...enlazar('idSede')}
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

      <div className="col-span-2">
        <SeleccionMultiple
          etiqueta="Películas"
          opciones={opcionesPeliculas}
          seleccionados={formulario.idsPeliculas}
          alCambiar={(ids) => {
            actualizar('idsPeliculas', ids);
            marcarTocado('idsPeliculas');
          }}
          textoVacio="Seleccione las películas del descuento"
          opcionTodas="Todas"
          todas={formulario.aplicaTodas}
          alCambiarTodas={(todas) => {
            actualizar('aplicaTodas', todas);
            if (todas) actualizar('idsPeliculas', []);
            marcarTocado('idsPeliculas');
          }}
        />
        <MensajeError id="error-peliculas" mensaje={errorPeliculasElegidas} />
      </div>

      <CampoMomento
        id="inicio"
        etiqueta="Fecha inicio"
        fecha={formulario.fechaInicio}
        hora={formulario.horaInicio}
        minuto={formulario.minutoInicio}
        error={errorInicio}
        alCambiar={(parte, valor) => actualizar({ fecha: 'fechaInicio', hora: 'horaInicio', minuto: 'minutoInicio' }[parte], valor)}
        alTocar={() => marcarTocado('inicio')}
      />

      <CampoMomento
        id="fin"
        etiqueta="Fecha final"
        fecha={formulario.fechaFin}
        hora={formulario.horaFin}
        minuto={formulario.minutoFin}
        error={errorFin}
        alCambiar={(parte, valor) => actualizar({ fecha: 'fechaFin', hora: 'horaFin', minuto: 'minutoFin' }[parte], valor)}
        alTocar={() => marcarTocado('fin')}
      />

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

export default FormularioDescuento;

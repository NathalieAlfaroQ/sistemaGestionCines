import { useUbicaciones } from '../ganchos/useUbicaciones.js';
import { POS_CANTON, POS_PROVINCIA } from '../constantes/posicionesUbicacion.js';
import MensajeError from '../common/MensajeError.jsx';
import { useFormularioSede } from '../ganchos/useFormularioSede.js';
import { normalizarNombre, NOMBRE_MAXIMO } from '../validaciones/validacionesSede.js';

const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseCampo = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseDesplegable = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseBotonConfirmar = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover disabled:opacity-50';

function Asterisco() {
  return <span className="text-danger">*</span>;
}

function FormularioSede({
  valorInicial,
  textoGuardar = 'Guardar',
  alEnviar,
  alCancelar,
  guardando = false,
  error = null,
}) {
  const { ubicaciones } = useUbicaciones();

  const {
    formulario,
    errorVisible,
    enlazar,
    cambiarProvincia,
    marcarTocado,
    validarAlEnviar,
  } = useFormularioSede({
    nombre: valorInicial?.nombre ?? '',
    idProvincia: String(valorInicial?.idProvincia ?? ''),
    idCanton: String(valorInicial?.idCanton ?? ''),
  });

  const errorNombre = errorVisible('nombre');
  const errorProvincia = errorVisible('idProvincia');
  const errorCanton = errorVisible('idCanton');

  const cantonesDisponibles = ubicaciones.cantones.filter(
    (canton) => String(canton[POS_CANTON.idProvincia]) === formulario.idProvincia
  );

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarAlEnviar()) return;

    alEnviar({
      nombre: normalizarNombre(formulario.nombre),
      idCanton: Number(formulario.idCanton),
    });
  }

  return (
    <form onSubmit={manejarEnvio} className="flex max-w-sm flex-col gap-10">
      <div>
        <label htmlFor="nombre" className={claseEtiqueta}>
          Nombre <Asterisco />
        </label>
        <input
          id="nombre"
          className={claseCampo}
          maxLength={NOMBRE_MAXIMO}
          aria-invalid={errorNombre !== null}
          aria-describedby={errorNombre ? 'error-nombre' : undefined}
          {...enlazar('nombre')}
        />
        <MensajeError id="error-nombre" mensaje={errorNombre} />
      </div>

      <div>
        <label htmlFor="provincia" className={claseEtiqueta}>
          Provincia <Asterisco />
        </label>
        <div className="relative">
          <select
            id="provincia"
            className={claseDesplegable}
            aria-invalid={errorProvincia !== null}
            aria-describedby={errorProvincia ? 'error-provincia' : undefined}
            value={formulario.idProvincia}
            onChange={(evento) => cambiarProvincia(evento.target.value)}
            onBlur={() => marcarTocado('idProvincia')}
          >
            <option value="" />
            {ubicaciones.provincias.map((provincia) => (
              <option key={provincia[POS_PROVINCIA.id]} value={provincia[POS_PROVINCIA.id]}>
                {provincia[POS_PROVINCIA.nombre]}
              </option>
            ))}
          </select>
        </div>
        <MensajeError id="error-provincia" mensaje={errorProvincia} />
      </div>

      <div>
        <label htmlFor="canton" className={claseEtiqueta}>
          Cantón <Asterisco />
        </label>
        <div className="relative">
          <select
            id="canton"
            className={claseDesplegable}
            aria-invalid={errorCanton !== null}
            aria-describedby={errorCanton ? 'error-canton' : undefined}
            disabled={formulario.idProvincia === ''}
            {...enlazar('idCanton')}
          >
            <option value="" />
            {cantonesDisponibles.map((canton) => (
              <option key={canton[POS_CANTON.id]} value={canton[POS_CANTON.id]}>
                {canton[POS_CANTON.nombre]}
              </option>
            ))}
          </select>
        </div>
        <MensajeError id="error-canton" mensaje={errorCanton} />
      </div>

      <div className="flex flex-col gap-4">
        <MensajeError mensaje={error} className="mt-0" />

        <p className="text-sm text-danger">* Espacio obligatorio</p>

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

export default FormularioSede;

import { useUbicaciones } from '../ganchos/useUbicaciones.js';
import { POS_CANTON, POS_PROVINCIA } from '../constantes/posicionesUbicacion.js';
import MensajeError from '../common/MensajeError.jsx';
import { useFormularioSede } from '../ganchos/useFormularioSede.js';
import { normalizarNombre, NOMBRE_MAXIMO } from '../validaciones/validacionesSede.js';
import { claseCampo, claseDesplegable } from '../constantes/clasesFormulario.js';
import Etiqueta from './Etiqueta.jsx';
import PieFormulario from './PieFormulario.jsx';


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
    hayCamposVacios,
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
        <Etiqueta id="nombre">Nombre</Etiqueta>
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
        <Etiqueta id="provincia">Provincia</Etiqueta>
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
        <Etiqueta id="canton">Cantón</Etiqueta>
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

      <PieFormulario
          error={error}
          hayCamposVacios={hayCamposVacios}
          guardando={guardando}
          textoGuardar={textoGuardar}
          alCancelar={alCancelar}
        />
    </form>
  );
}

export default FormularioSede;

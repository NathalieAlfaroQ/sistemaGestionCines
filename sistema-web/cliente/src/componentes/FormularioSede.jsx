import { useState } from 'react';
import { useUbicaciones } from '../ganchos/useUbicaciones.js';
import { POS_CANTON, POS_PROVINCIA } from '../constantes/posicionesUbicacion.js';
import MensajeError from '../common/MensajeError.jsx';

const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseCampo = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseDesplegable = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseBotonConfirmar = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover disabled:opacity-50';

const NOMBRE_MINIMO = 10;
const NOMBRE_MAXIMO = 50;
const PATRON_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

function normalizarNombre(nombre) {
  return nombre.trim().replace(/\s+/g, ' ');
}

const MENSAJE_OBLIGATORIO = 'Este campo es obligatorio';

function errorDeFormato(nombre) {
  return nombre !== '' && !PATRON_NOMBRE.test(nombre) ? 'Solo se admiten letras' : null;
}

function errorDeLargo(nombre) {
  return nombre !== '' && nombre.length < NOMBRE_MINIMO
    ? `Debe tener al menos ${NOMBRE_MINIMO} caracteres`
    : null;
}

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

  const [formulario, setFormulario] = useState({
    nombre: valorInicial?.nombre ?? '',
    idProvincia: String(valorInicial?.idProvincia ?? ''),
    idCanton: String(valorInicial?.idCanton ?? ''),
  });
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [nombreTocado, setNombreTocado] = useState(false);

  const cantonesDisponibles = ubicaciones.cantones.filter(
    (canton) => String(canton[POS_CANTON.idProvincia]) === formulario.idProvincia
  );

  const nombreNormalizado = normalizarNombre(formulario.nombre);
  const hayCamposVacios =
    nombreNormalizado === '' || formulario.idProvincia === '' || formulario.idCanton === '';

  // Cada error aparece debajo de su campo
  // Los de formato salen mientras se escribe; el de largo al salir del campo; el obligatorio al guardar
  const mensajeNombre =
    errorDeFormato(nombreNormalizado) ??
    (nombreTocado || intentoEnvio ? errorDeLargo(nombreNormalizado) : null) ??
    (intentoEnvio && nombreNormalizado === '' ? MENSAJE_OBLIGATORIO : null);
  const mensajeProvincia = intentoEnvio && formulario.idProvincia === '' ? MENSAJE_OBLIGATORIO : null;
  const mensajeCanton = intentoEnvio && formulario.idCanton === '' ? MENSAJE_OBLIGATORIO : null;

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function cambiarProvincia(evento) {
    setFormulario((anterior) => ({
      ...anterior,
      idProvincia: evento.target.value,
      idCanton: '',
    }));
  }

  function manejarEnvio(evento) {
    evento.preventDefault();

    if (hayCamposVacios || errorDeFormato(nombreNormalizado) || errorDeLargo(nombreNormalizado)) {
      setIntentoEnvio(true);
      return;
    }

    alEnviar({ nombre: nombreNormalizado, idCanton: Number(formulario.idCanton) });
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
          aria-invalid={mensajeNombre !== null}
          aria-describedby={mensajeNombre ? 'error-nombre' : undefined}
          value={formulario.nombre}
          onBlur={() => setNombreTocado(true)}
          onChange={(evento) => actualizar('nombre', evento.target.value)}
        />
        <MensajeError id="error-nombre" mensaje={mensajeNombre} />
      </div>

      <div>
        <label htmlFor="provincia" className={claseEtiqueta}>
          Provincia <Asterisco />
        </label>
        <div className="relative">
          <select
            id="provincia"
            className={claseDesplegable}
            aria-invalid={mensajeProvincia !== null}
            aria-describedby={mensajeProvincia ? 'error-provincia' : undefined}
            value={formulario.idProvincia}
            onChange={cambiarProvincia}
          >
            <option value="" />
            {ubicaciones.provincias.map((provincia) => (
              <option key={provincia[POS_PROVINCIA.id]} value={provincia[POS_PROVINCIA.id]}>
                {provincia[POS_PROVINCIA.nombre]}
              </option>
            ))}
          </select>
        </div>
        <MensajeError id="error-provincia" mensaje={mensajeProvincia} />
      </div>

      <div>
        <label htmlFor="canton" className={claseEtiqueta}>
          Cantón <Asterisco />
        </label>
        <div className="relative">
          <select
            id="canton"
            className={claseDesplegable}
            aria-invalid={mensajeCanton !== null}
            aria-describedby={mensajeCanton ? 'error-canton' : undefined}
            disabled={formulario.idProvincia === ''}
            value={formulario.idCanton}
            onChange={(evento) => actualizar('idCanton', evento.target.value)}
          >
            <option value="" />
            {cantonesDisponibles.map((canton) => (
              <option key={canton[POS_CANTON.id]} value={canton[POS_CANTON.id]}>
                {canton[POS_CANTON.nombre]}
              </option>
            ))}
          </select>
        </div>
        <MensajeError id="error-canton" mensaje={mensajeCanton} />
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

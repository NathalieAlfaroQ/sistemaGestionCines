import { useState } from 'react';
import { useUbicaciones } from '../ganchos/useUbicaciones.js';
import { POS_CANTON, POS_PROVINCIA } from '../constantes/posicionesUbicacion.js';

const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseCampo = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseDesplegable = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-soft placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseBotonConfirmar = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar = 'flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-danger-hover disabled:opacity-50';

const NOMBRE_MINIMO = 10;
const NOMBRE_MAXIMO = 20;
const PATRON_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

function normalizarNombre(nombre) {
  return nombre.trim().replace(/\s+/g, ' ');
}

function errorDeNombre(nombre) {
  if (nombre === '') return null;
  if (!PATRON_NOMBRE.test(nombre)) return 'El nombre solo puede contener letras y espacios';
  if (nombre.length < NOMBRE_MINIMO) return `El nombre debe tener al menos ${NOMBRE_MINIMO} caracteres`;
  return null;
}

function IconoFlecha() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-color peer-disabled:opacity-50"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
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
}) {
  const { ubicaciones } = useUbicaciones();

  const [formulario, setFormulario] = useState({
    nombre: valorInicial?.nombre ?? '',
    idProvincia: String(valorInicial?.idProvincia ?? ''),
    idCanton: String(valorInicial?.idCanton ?? ''),
  });
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const cantonesDisponibles = ubicaciones.cantones.filter(
    (canton) => String(canton[POS_CANTON.idProvincia]) === formulario.idProvincia
  );

  const nombreNormalizado = normalizarNombre(formulario.nombre);
  const hayCamposVacios =
    nombreNormalizado === '' || formulario.idProvincia === '' || formulario.idCanton === '';
  const mostrarObligatorio = intentoEnvio && hayCamposVacios;

  const errorNombre = errorDeNombre(nombreNormalizado);
  const mostrarErrorNombre = intentoEnvio && errorNombre !== null;

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

    if (hayCamposVacios || errorNombre !== null) {
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
          aria-invalid={mostrarErrorNombre}
          aria-describedby={mostrarErrorNombre ? 'error-nombre' : undefined}
          value={formulario.nombre}
          onChange={(evento) => actualizar('nombre', evento.target.value)}
        />
        {mostrarErrorNombre && (
          <p id="error-nombre" role="alert" className="mt-2 text-sm text-danger">
            {errorNombre}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="provincia" className={claseEtiqueta}>
          Provincia <Asterisco />
        </label>
        <div className="relative">
          <select
            id="provincia"
            className={claseDesplegable}
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
          <IconoFlecha />
        </div>
      </div>

      <div>
        <label htmlFor="Canton" className={claseEtiqueta}>
          Canton <Asterisco />
        </label>
        <div className="relative">
          <select
            id="Canton"
            className={claseDesplegable}
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
          <IconoFlecha />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {mostrarObligatorio && (
          <p role="alert" className="text-sm text-danger">
            *Espacio obligatorio
          </p>
        )}

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

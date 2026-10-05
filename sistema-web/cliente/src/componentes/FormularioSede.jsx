import { useState } from 'react';
import { useUbicaciones } from '../ganchos/useUbicaciones.js';
import { POS_CANTON, POS_PROVINCIA } from '../constantes/posicionesUbicacion.js';

const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseCampo = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseDesplegable = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-soft placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseBotonConfirmar = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar = 'flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-danger-hover disabled:opacity-50';


const NOMBRE_MAXIMO = 50;

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

  const cantonesDisponibles = ubicaciones.cantones.filter(
    (canton) => String(canton[POS_CANTON.idProvincia]) === formulario.idProvincia
  );

  const hayCamposVacios =
    formulario.nombre.trim() === '' || formulario.idProvincia === '' || formulario.idCanton === '';
  const mostrarObligatorio = intentoEnvio && hayCamposVacios;

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

    if (hayCamposVacios) {
      setIntentoEnvio(true);
      return;
    }

    alEnviar({ nombre: formulario.nombre.trim(), idCanton: Number(formulario.idCanton) });
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
          value={formulario.nombre}
          onChange={(evento) => actualizar('nombre', evento.target.value)}
        />
      </div>

      <div>
        <label htmlFor="provincia" className={claseEtiqueta}>
          Provincia <Asterisco />
        </label>
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
      </div>

      <div>
        <label htmlFor="canton" className={claseEtiqueta}>
          Canton <Asterisco />
        </label>
        <select
          id="canton"
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
      </div>

      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
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

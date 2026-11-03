import MensajeError from '../common/MensajeError.jsx';

const claseBotonConfirmar =
  'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar =
  'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover disabled:opacity-50';

function PieFormulario({ error, hayCamposVacios, guardando, textoGuardar, alCancelar, className = '' }) {
  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      <MensajeError mensaje={error} className="mt-0" />

      {/* Desaparece cuando ya no queda ningún campo obligatorio vacío */}
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
  );
}

export default PieFormulario;

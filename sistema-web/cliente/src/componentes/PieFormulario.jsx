import MensajeError from '../common/MensajeError.jsx';
import { claseBotonPrincipal, claseBotonSecundario } from '../constantes/clasesFormulario.js';

function PieFormulario({ error, hayCamposVacios, guardando, textoGuardar, alCancelar, className = '' }) {
  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      <MensajeError mensaje={error} className="mt-0" />

      {/* */}
      {hayCamposVacios && <p className="text-sm text-danger">* Espacio obligatorio</p>}

      <div className="flex gap-4">
        <button type="submit" disabled={guardando} className={claseBotonPrincipal}>
          {guardando ? 'Guardando...' : textoGuardar}
        </button>

        <button type="button" onClick={alCancelar} className={claseBotonSecundario}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default PieFormulario;

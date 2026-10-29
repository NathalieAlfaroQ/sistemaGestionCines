import { POS_TIPO_BOLETO } from '../constantes/posicionesReserva.js';
import { formatearColones } from '../utilidades/moneda.js';

const claseContador =
  'h-7 w-7 flex items-center justify-center rounded text-lg text-text-color hover:bg-brand disabled:opacity-30 disabled:hover:bg-transparent';

function ContadorBoleto({ tipo, cantidad, alAgregar, alQuitar }) {
  const nombre = tipo[POS_TIPO_BOLETO.nombre];
  return (
    <li className="flex items-center justify-between rounded-md border border-border px-4 py-3">
      <span>
        {nombre} <span className="ml-1 text-sm text-white/50">{formatearColones(tipo[POS_TIPO_BOLETO.precio])}</span>
      </span>

      <span className="flex items-center gap-2">
        <button type="button" onClick={alQuitar} disabled={cantidad === 0} aria-label={`Quitar boleto ${nombre}`} className={claseContador}>
          −
        </button>
        <span className="w-5 text-center" aria-live="polite">
          {cantidad}
        </span>
        <button type="button" onClick={alAgregar} aria-label={`Agregar boleto ${nombre}`} className={claseContador}>
          +
        </button>
      </span>
    </li>
  );
}

// Panel derecho: boletos por tipo, totales y acciones
function PanelBoletos({ seleccion, tiposBoleto, aviso, verificando, alCancelar, alContinuar }) {
  return (
    <aside className="flex flex-col gap-5 text-text-color">
      <h2>Entradas seleccionadas</h2>

      <ul className="flex flex-col gap-3">
        {tiposBoleto.map((tipo) => {
          const idTipo = tipo[POS_TIPO_BOLETO.id];
          return (
            <ContadorBoleto
              key={idTipo}
              tipo={tipo}
              cantidad={seleccion.cantidadDe(idTipo)}
              alAgregar={() => seleccion.agregarBoleto(idTipo)}
              alQuitar={() => seleccion.quitarBoleto(idTipo)}
            />
          );
        })}
      </ul>

      <dl className="flex flex-col gap-3">
        <div className="flex justify-between">
          <dt>Cantidad de entradas:</dt>
          <dd>{seleccion.totalBoletos}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Monto total:</dt>
          <dd>{formatearColones(seleccion.montoTotal)}</dd>
        </div>
      </dl>

      {aviso && (
        <p role="alert" className="rounded-md border border-warning px-4 py-3 text-sm text-warning">
          {aviso}
        </p>
      )}

      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={alCancelar}
          className="rounded-md bg-brand-soft px-5 py-2 text-sm text-black hover:bg-brand-soft-hover"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={alContinuar}
          disabled={verificando}
          className="flex items-center gap-2 rounded-md bg-brand px-5 py-2 text-sm hover:bg-brand-hover disabled:opacity-50"
        >
          {verificando ? 'Verificando...' : 'Continuar'}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default PanelBoletos;
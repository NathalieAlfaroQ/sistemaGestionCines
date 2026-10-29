import { POS_ASIENTO } from '../constantes/posicionesReserva.js';

export const ESTADOS_ASIENTO = {
  disponible: { etiqueta: 'Disponible', clase: 'text-[#EFE6CF]' },
  reservado: { etiqueta: 'Reservado', clase: 'text-[#7B3FB5]' },
  seleccionado: { etiqueta: 'Seleccionado', clase: 'text-[#E5483B]' },
};

function IconoAsiento({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="3" width="14" height="11" rx="3" />
      <rect x="2" y="9" width="4" height="10" rx="1.5" />
      <rect x="18" y="9" width="4" height="10" rx="1.5" />
      <rect x="5" y="15" width="14" height="5" rx="1.5" />
    </svg>
  );
}

function Pantalla() {
  return (
    <div className="mx-auto mb-10 w-full max-w-xl" aria-hidden="true">
      <div
        className="h-14 flex items-center justify-center bg-[#5A5A72] text-sm text-white/80"
        style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)' }}
      >
        Pantalla
      </div>
      <div
        className="h-14 bg-gradient-to-b from-white/15 to-transparent"
        style={{ clipPath: 'polygon(12% 0, 88% 0, 100% 100%, 0 100%)' }}
      />
    </div>
  );
}

function agruparPorFila(asientos) {
  const filas = new Map();
  for (const asiento of asientos) {
    const fila = asiento[POS_ASIENTO.fila];
    if (!filas.has(fila)) filas.set(fila, []);
    filas.get(fila).push(asiento);
  }
  return [...filas];
}

function estadoDe(asiento, seleccionado) {
  if (asiento[POS_ASIENTO.ocupado]) return 'reservado';
  return seleccionado ? 'seleccionado' : 'disponible';
}

function MapaAsientos({ asientos, estaSeleccionado, alAlternar, etiquetasSeleccionados }) {
  return (
    <section aria-label="Mapa de asientos" className="flex flex-col gap-8 text-text-color">
      <Pantalla />

      <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
        {agruparPorFila(asientos).map(([fila, asientosFila]) => (
          <div key={fila} className="flex items-center gap-3">
            <span className="w-4 text-center text-sm font-semibold">{fila}</span>

            <ul className="flex gap-1.5">
              {asientosFila.map((asiento) => {
                const etiqueta = `${fila}${asiento[POS_ASIENTO.numero]}`;
                const estado = estadoDe(asiento, estaSeleccionado(asiento[POS_ASIENTO.id]));
                return (
                  <li key={asiento[POS_ASIENTO.id]}>
                    <button
                      type="button"
                      onClick={() => alAlternar(asiento)}
                      disabled={estado === 'reservado'}
                      aria-pressed={estado === 'seleccionado'}
                      aria-label={`Asiento ${etiqueta}, ${ESTADOS_ASIENTO[estado].etiqueta.toLowerCase()}`}
                      title={etiqueta}
                      className={`block rounded hover:brightness-125 disabled:cursor-not-allowed disabled:hover:brightness-100 ${ESTADOS_ASIENTO[estado].clase}`}
                    >
                      <IconoAsiento className="h-6 w-6" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <span className="w-4 text-center text-sm font-semibold">{fila}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <p className="flex items-center gap-2">
          <IconoAsiento className={`h-5 w-5 ${ESTADOS_ASIENTO.seleccionado.clase}`} />
          {etiquetasSeleccionados.length} {etiquetasSeleccionados.length === 1 ? 'asiento seleccionado' : 'asientos seleccionados'}
        </p>
        <p aria-live="polite">{etiquetasSeleccionados.join(', ')}</p>
      </div>

      <ul aria-label="Leyenda" className="flex flex-wrap gap-x-10 gap-y-3">
        {Object.entries(ESTADOS_ASIENTO).map(([clave, { etiqueta, clase }]) => (
          <li key={clave} className="flex items-center gap-2">
            <IconoAsiento className={`h-6 w-6 ${clase}`} />
            {etiqueta}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MapaAsientos;
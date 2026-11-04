import { useState } from 'react';

const DIAS_VISIBLES = 7;

const claseFlecha =
  'w-10 shrink-0 flex items-center justify-center rounded-md bg-surface text-text-color ' +
  'hover:bg-brand disabled:opacity-30 disabled:hover:bg-surface';

function Flecha({ direccion, deshabilitada, alPulsar }) {
  const esIzquierda = direccion === 'izquierda';
  return (
    <button
      type="button"
      onClick={alPulsar}
      disabled={deshabilitada}
      aria-label={esIzquierda ? 'Días anteriores' : 'Días siguientes'}
      className={claseFlecha}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={esIzquierda ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

// Carrusel de días: muestra DIAS_VISIBLES a la vez y las flechas lo mueven de a un día
function SelectorFechas({ dias, seleccionada, alSeleccionar }) {
  const [inicio, setInicio] = useState(0);
  const ultimoInicio = Math.max(0, dias.length - DIAS_VISIBLES);
  const visibles = dias.slice(inicio, inicio + DIAS_VISIBLES);

  return (
    <nav aria-label="Elegir fecha" className="flex gap-2">
      <Flecha direccion="izquierda" deshabilitada={inicio === 0} alPulsar={() => setInicio(inicio - 1)} />

      <ul className="flex-1 grid grid-cols-7 gap-2">
        {visibles.map((dia) => {
          const activo = dia.valor === seleccionada;
          return (
            <li key={dia.valor}>
              <button
                type="button"
                onClick={() => alSeleccionar(dia.valor)}
                aria-pressed={activo}
                className={
                  'h-16 w-full flex flex-col items-center justify-center rounded-md border text-xs ' +
                  (activo
                    ? 'border-brand-soft bg-brand text-text-color'
                    : 'border-border bg-surface text-white/80 hover:border-brand-soft')
                }
              >
                <span>{dia.etiqueta}</span>
                {dia.dia && <span className="text-sm font-semibold">{dia.dia}</span>}
                {dia.mes && <span>{dia.mes}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <Flecha direccion="derecha" deshabilitada={inicio >= ultimoInicio} alPulsar={() => setInicio(inicio + 1)} />
    </nav>
  );
}

export default SelectorFechas;
import { useEffect, useRef, useState } from 'react';
import { POS_CATALOGO } from '../constantes/posicionesCatalogo.js';

// opcionTodas (opcional): texto de una opción que reemplaza a todas las demás, como "Todas".
// Con ella, todas indica si está elegida y alCambiarTodas recibe true/false al elegirla o quitarla.
function SeleccionMultiple({
  etiqueta,
  opciones,
  seleccionados,
  alCambiar,
  textoVacio,
  obligatorio = true,
  opcionTodas = null,
  todas = false,
  alCambiarTodas = () => {},
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    function alClicFuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) {
        setAbierto(false);
      }
    }

    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  const elegidas = opciones.filter((opcion) => seleccionados.includes(opcion[POS_CATALOGO.id]));
  const disponibles = opciones.filter((opcion) => !seleccionados.includes(opcion[POS_CATALOGO.id]));

  function agregar(id) {
    alCambiar([...seleccionados, id]);
    setAbierto(false);
  }

  function quitar(id) {
    alCambiar(seleccionados.filter((elegido) => elegido !== id));
  }

  return (
    <div className="relative" ref={contenedor}>
      <label className="mb-2 block text-sm text-text-color">
        {etiqueta} {obligatorio && <span className="text-danger">*</span>}
      </label>

      <div className="w-full min-h-11 px-3 py-2 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface">
        {elegidas.length === 0 && !todas && <span className="text-sm text-text-muted">{textoVacio}</span>}

        {todas && (
          <span className="px-2 py-1 flex items-center gap-2 rounded bg-brand text-sm text-text-color">
            {opcionTodas}
            <button
              type="button"
              onClick={() => alCambiarTodas(false)}
              className="leading-none text-text-color/70 hover:text-text-color"
              aria-label={`Quitar ${opcionTodas}`}
            >
              ×
            </button>
          </span>
        )}

        {elegidas.map((opcion) => (
          <span
            key={opcion[POS_CATALOGO.id]}
            className="px-2 py-1 flex items-center gap-2 rounded bg-brand text-sm text-text-color"
          >
            {opcion[POS_CATALOGO.nombre]}
            <button
              type="button"
              onClick={() => quitar(opcion[POS_CATALOGO.id])}
              className="leading-none text-text-color/70 hover:text-text-color"
              aria-label={`Quitar ${opcion[POS_CATALOGO.nombre]}`}
            >
              ×
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="ml-auto text-text-color"
          aria-label={`Abrir opciones de ${etiqueta}`}
          aria-expanded={abierto}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {abierto && (
        <ul className="w-full max-h-48 absolute z-10 mt-1 overflow-y-auto rounded-lg border border-border bg-surface">
          {todas && (
            <li className="px-3 py-2 text-sm text-text-muted">Quite «{opcionTodas}» para elegir una por una</li>
          )}

          {!todas && opcionTodas && (
            <li>
              <button
                type="button"
                onClick={() => {
                  alCambiarTodas(true);
                  setAbierto(false);
                }}
                className="w-full px-3 py-2 text-left text-sm font-semibold text-text-color hover:bg-brand"
              >
                {opcionTodas}
              </button>
            </li>
          )}

          {!todas && disponibles.length === 0 && (
            <li className="px-3 py-2 text-sm text-text-muted">No quedan opciones</li>
          )}

          {!todas && disponibles.map((opcion) => (
            <li key={opcion[POS_CATALOGO.id]}>
              <button
                type="button"
                onClick={() => agregar(opcion[POS_CATALOGO.id])}
                className="w-full px-3 py-2 text-left text-sm text-text-color hover:bg-brand"
              >
                {opcion[POS_CATALOGO.nombre]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SeleccionMultiple;

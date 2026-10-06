import { useEffect, useId } from 'react';

const clasesBoton = {
  principal: 'bg-black text-text-color hover:bg-surface',
  secundario: 'border border-black text-text-color hover:bg-black/40',
  peligro: 'bg-danger text-text-color hover:brightness-110',
};

function Modal({ titulo, mensaje, children, botones, alCerrar }) {
  const idTitulo = useId();
  const idMensaje = useId();
  const indiceEnfocado = Math.max(0, botones.findIndex((boton) => boton.enfocar));

  useEffect(() => {
    if (!alCerrar) return undefined;

    function alPulsarTecla(evento) {
      if (evento.key === 'Escape') alCerrar();
    }

    document.addEventListener('keydown', alPulsarTecla);
    return () => document.removeEventListener('keydown', alPulsarTecla);
  }, [alCerrar]);

  function alPulsarFondo(evento) {
    if (alCerrar && evento.target === evento.currentTarget) alCerrar();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={alPulsarFondo}
      role="none"
    >
      <dialog
        aria-modal="true"
        aria-labelledby={titulo ? idTitulo : idMensaje}
        aria-describedby={titulo ? idMensaje : undefined}
        className="w-full max-w-sm rounded-lg bg-border px-8 py-10 text-center"
      >
        {titulo && (
          <h2 id={idTitulo} className="mb-3 text-lg font-bold text-text-color">
            {titulo}
          </h2>
        )}

        <p id={idMensaje} className="mb-6 text-text-color">
          {mensaje}
        </p>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex flex-wrap justify-center gap-3">
          {botones.map((boton, indice) => (
            <button
              key={boton.texto}
              type="button"
              autoFocus={indice === indiceEnfocado}
              onClick={boton.alPulsar}
              className={`rounded px-4 py-1.5 text-sm transition-colors ${clasesBoton[boton.variante ?? 'principal']}`}
            >
              {boton.texto}
            </button>
          ))}
        </div>
      </dialog>
    </div>
  );
}

export default Modal;

import { useEffect, useId, useRef } from 'react';

const clasesBoton = {
  principal: 'bg-black text-text-color hover:bg-surface',
  secundario: 'border border-black text-text-color hover:bg-black/40',
  peligro: 'bg-danger text-text-color hover:brightness-110',
};

function Modal({ titulo, mensaje, children, botones, alCerrar }) {
  const idTitulo = useId();
  const idMensaje = useId();
  const refDialogo = useRef(null);
  const refBotonEnfocado = useRef(null);
  const indiceEnfocado = Math.max(0, botones.findIndex((boton) => boton.enfocar));

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo.open) dialogo.showModal();
    refBotonEnfocado.current?.focus();
  }, []);

  function alCancelar(evento) {
    evento.preventDefault();
    alCerrar?.();
  }

  return (
    <dialog
      ref={refDialogo}
      aria-labelledby={titulo ? idTitulo : idMensaje}
      aria-describedby={titulo ? idMensaje : undefined}
      onCancel={alCancelar}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 text-text-color open:flex backdrop:bg-black/60"
    >
      {/* */}
      {alCerrar && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar"
          onClick={alCerrar}
          className="absolute inset-0 h-full w-full cursor-default"
        />
      )}

      <div className="relative w-full max-w-sm rounded-lg bg-border px-8 py-10 text-center">
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
              ref={indice === indiceEnfocado ? refBotonEnfocado : undefined}
              onClick={boton.alPulsar}
              className={`rounded px-4 py-1.5 text-sm transition-colors ${clasesBoton[boton.variante ?? 'principal']}`}
            >
              {boton.texto}
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}

export default Modal;


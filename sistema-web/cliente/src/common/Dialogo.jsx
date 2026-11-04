import { useEffect, useRef } from 'react';

const SELECTOR_ENFOCABLE = 'input, select, textarea, button:not([tabindex="-1"])';


function Dialogo({
  idTitulo,
  idDescripcion,
  alCerrar,
  cerrarAlClicFuera = true,
  refEnfoque,
  claseCaja,
  children,
}) {
  const refDialogo = useRef(null);

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo.open) dialogo.showModal();
    const elemento = refEnfoque?.current ?? dialogo.querySelector(SELECTOR_ENFOCABLE);
    elemento?.focus();
  }, [refEnfoque]);

  function alCancelar(evento) {
    evento.preventDefault();
    alCerrar?.();
  }

  return (
    <dialog
      ref={refDialogo}
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onCancel={alCancelar}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 text-text-color open:flex backdrop:bg-black/60"
    >
      {/* */}
      {alCerrar && cerrarAlClicFuera && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar"
          onClick={alCerrar}
          className="absolute inset-0 h-full w-full cursor-default"
        />
      )}

      <div className={`relative ${claseCaja}`}>{children}</div>
    </dialog>
  );
}

export default Dialogo;

import { useEffect, useRef } from 'react';

const SELECTOR_ENFOCABLE = 'input, select, textarea, button:not([tabindex="-1"])';

/**
 * Base de todos los cuadros de diálogo (Modal, ModalFormulario...), construida sobre el
 * elemento nativo <dialog>: el navegador lo muestra por encima de todo, deja inactivo el
 * resto de la página y mantiene el foco dentro. Se muestra mientras esté montado, así que
 * se usa con renderizado condicional: {mostrar && <Modal ... />}.
 *
 * Props:
 * - idTitulo:        id del elemento que da nombre al diálogo (aria-labelledby)
 * - idDescripcion:   (opcional) id del elemento que lo describe (aria-describedby)
 * - alCerrar:        (opcional) si se indica, Escape cierra el diálogo; sin ella, Escape no hace nada
 * - cerrarAlClicFuera: (opcional, true por defecto) con alCerrar, también cierra al hacer clic fuera
 * - refEnfoque:      (opcional) ref del elemento que recibe el foco al abrir; si no se indica,
 *                    el primer campo o botón del diálogo
 * - claseCaja:       clases de la caja visible del diálogo (ancho, relleno, alineación)
 * - children:        contenido de la caja
 */
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

  // showModal() abre el <dialog> como modal. El foco inicial se fija a mano porque el
  // navegador elegiría el primer elemento enfocable, que podría no ser el deseado.
  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo.open) dialogo.showModal();
    const elemento = refEnfoque?.current ?? dialogo.querySelector(SELECTOR_ENFOCABLE);
    elemento?.focus();
  }, [refEnfoque]);

  // Escape dispara "cancel". Se evita siempre el cierre nativo: el diálogo solo se cierra
  // cuando el componente padre lo desmonta (alCerrar), así React y el DOM no se desincronizan.
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
      {/* Fondo clicable para cerrar. Es un botón real (accesible) pero fuera del orden
          del Tab: con teclado se cierra con Escape. */}
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

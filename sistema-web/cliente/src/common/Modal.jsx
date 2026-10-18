import { useId, useRef } from 'react';
import Dialogo from './Dialogo.jsx';

const clasesBoton = {
  principal: 'bg-black text-text-color hover:bg-surface',
  secundario: 'border border-black text-text-color hover:bg-black/40',
  peligro: 'bg-danger text-text-color hover:brightness-110',
};

/**
 * Cuadro de diálogo para mensajes y confirmaciones.
 *
 * Props:
 * - titulo:    (opcional) encabezado del cuadro
 * - mensaje:   texto principal
 * - children:  (opcional) contenido adicional debajo del mensaje
 * - botones:   [{ texto, alPulsar, variante?, enfocar? }]
 *     variante → 'principal' (por defecto), 'secundario' o 'peligro'
 *     enfocar  → el botón que recibe el foco al abrir (por defecto, el primero;
 *                en acciones destructivas conviene enfocar "Cancelar")
 * - alCerrar:  (opcional) si se indica, el cuadro también se cierra con Escape
 *              y al hacer clic fuera de él
 *
 * Ejemplos:
 *   <Modal mensaje="Elemento creado con éxito"
 *          botones={[{ texto: 'Continuar', alPulsar: continuar }]} />
 *
 *   <Modal mensaje="¿Eliminar el elemento?" alCerrar={cerrar}
 *          botones={[
 *            { texto: 'Cancelar', variante: 'secundario', enfocar: true, alPulsar: cerrar },
 *            { texto: 'Eliminar', variante: 'peligro', alPulsar: eliminar },
 *          ]} />
 */
function Modal({ titulo, mensaje, children, botones, alCerrar }) {
  const idTitulo = useId();
  const idMensaje = useId();
  const refBotonEnfocado = useRef(null);
  const indiceEnfocado = Math.max(0, botones.findIndex((boton) => boton.enfocar));

  return (
    <Dialogo
      idTitulo={titulo ? idTitulo : idMensaje}
      idDescripcion={titulo ? idMensaje : undefined}
      alCerrar={alCerrar}
      refEnfoque={refBotonEnfocado}
      claseCaja="w-full max-w-sm rounded-lg bg-border px-8 py-10 text-center"
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
            ref={indice === indiceEnfocado ? refBotonEnfocado : undefined}
            onClick={boton.alPulsar}
            className={`rounded px-4 py-1.5 text-sm transition-colors ${clasesBoton[boton.variante ?? 'principal']}`}
          >
            {boton.texto}
          </button>
        ))}
      </div>
    </Dialogo>
  );
}

export default Modal;

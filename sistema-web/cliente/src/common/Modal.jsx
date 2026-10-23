import { useId, useRef } from 'react';
import Dialogo from './Dialogo.jsx';
import Boton from './Boton.jsx';

const variantesBoton = {
  principal: 'oscuro',
  secundario: 'contornoOscuro',
  peligro: 'peligro',
};

function Modal({ titulo, mensaje, icono, children, botones, alCerrar }) {
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
      {icono && <div className="mx-auto mb-4 w-fit text-text-color">{icono}</div>}

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
          <Boton
            key={indice}
            ref={indice === indiceEnfocado ? refBotonEnfocado : undefined}
            tamano="sm"
            variante={variantesBoton[boton.variante ?? 'principal']}
            disabled={boton.deshabilitado}
            onClick={boton.alPulsar}
          >
            {boton.texto}
          </Boton>
        ))}
      </div>
    </Dialogo>
  );
}

export default Modal;

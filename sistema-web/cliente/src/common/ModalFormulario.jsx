import { useId } from 'react';
import Dialogo from './Dialogo.jsx';
import { IconoEquis } from './iconos.jsx';

// ancho: clase de Tailwind con el ancho máximo de la caja (por defecto, estrecha como la de sedes)
function ModalFormulario({ titulo, alCerrar, ancho = 'max-w-md', children }) {
  const idTitulo = useId();

  return (
    <Dialogo
      idTitulo={idTitulo}
      alCerrar={alCerrar}
      cerrarAlClicFuera={false}
      claseCaja={`max-h-full w-full overflow-y-auto rounded-lg bg-border px-8 py-8 ${ancho}`}
    >
      <h2 id={idTitulo} className="mb-6 pr-10 text-2xl font-bold text-text-color">
        {titulo}
      </h2>

      {children}

      {alCerrar && (
        <button
          type="button"
          aria-label="Cerrar"
          onClick={alCerrar}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-color transition-colors hover:bg-text-color/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-color"
        >
          <IconoEquis className="h-5 w-5" />
        </button>
      )}
    </Dialogo>
  );
}

export default ModalFormulario;

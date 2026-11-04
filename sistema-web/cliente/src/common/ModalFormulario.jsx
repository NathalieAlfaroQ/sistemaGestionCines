import { useId } from 'react';
import Dialogo from './Dialogo.jsx';

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
      <h2 id={idTitulo} className="mb-6 text-2xl font-bold text-text-color">
        {titulo}
      </h2>

      {children}
    </Dialogo>
  );
}

export default ModalFormulario;

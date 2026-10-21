import { useId } from 'react';
import Dialogo from './Dialogo.jsx';

function ModalFormulario({ titulo, alCerrar, children }) {
  const idTitulo = useId();

  return (
    <Dialogo
      idTitulo={idTitulo}
      alCerrar={alCerrar}
      cerrarAlClicFuera={false}
      claseCaja="w-full max-w-md rounded-lg bg-border px-8 py-8"
    >
      <h2 id={idTitulo} className="mb-6 text-2xl font-bold text-text-color">
        {titulo}
      </h2>

      {children}
    </Dialogo>
  );
}

export default ModalFormulario;

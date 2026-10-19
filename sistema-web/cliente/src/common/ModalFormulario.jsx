import { useId } from 'react';
import Dialogo from './Dialogo.jsx';

const anchos = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

function ModalFormulario({ titulo, alCerrar, ancho = 'md', children }) {
  const idTitulo = useId();

  return (
    <Dialogo
      idTitulo={idTitulo}
      alCerrar={alCerrar}
      cerrarAlClicFuera={false}
      claseCaja={`w-full ${anchos[ancho] ?? anchos.md} rounded-lg bg-border px-8 py-8`}
    >
      <h2 id={idTitulo} className="mb-6 text-2xl font-bold text-text-color">
        {titulo}
      </h2>

      {children}
    </Dialogo>
  );
}

export default ModalFormulario;

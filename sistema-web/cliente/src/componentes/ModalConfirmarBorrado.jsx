import { useState } from 'react';
import { Button, Modal, ModalBody, ModalHeader } from 'flowbite-react';
import MensajeError from './MensajeError.jsx';

function ModalConfirmarBorrado({ elemento, alConfirmar, alCerrar, alBorrado }) {
  const [borrando, setBorrando] = useState(false);
  const [mensajeError, setMensajeError] = useState(null);

  function cerrar() {
    if (!borrando) alCerrar();
  }

  async function confirmar() {
    setBorrando(true);
    setMensajeError(null);

    try {
      await alConfirmar();
      alBorrado();
    } catch (error) {
      console.error('Error al borrar:', error);
      setMensajeError(error.message);
      setBorrando(false);
    }
  }

  return (
    <Modal show size="md" popup onClose={cerrar}>
      <ModalHeader />
      <ModalBody>
        <div className="text-center text-white">
          <svg
            className="mx-auto mb-4 h-14 w-14 text-[#B188CE]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>

          <h3 className="mb-5 text-lg font-normal">¿Está seguro de que desea borrar {elemento}?</h3>

          <MensajeError mensaje={mensajeError} />

          <div className="mt-5 flex justify-center gap-4">
            <Button color="brand" disabled={borrando} onClick={cerrar}>
              Cancelar
            </Button>
            <Button color="peligro" disabled={borrando} onClick={confirmar}>
              {borrando ? 'Borrando...' : 'Borrar'}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

export default ModalConfirmarBorrado;
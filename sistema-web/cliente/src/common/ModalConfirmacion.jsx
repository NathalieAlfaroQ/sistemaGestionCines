import { useState } from 'react';
import Modal from './Modal.jsx';

function ModalConfirmacion({
  mensaje,
  titulo,
  icono,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  textoProcesando = 'Procesando...',
  peligrosa = false,
  alConfirmar,
  alExito,
  alCancelar,
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  function cancelar() {
    if (!procesando) alCancelar();
  }

  async function confirmar() {
    setProcesando(true);
    setError(null);

    try {
      await alConfirmar();
      alExito?.();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      titulo={titulo}
      mensaje={mensaje}
      icono={icono}
      alCerrar={cancelar}
      botones={[
        {
          texto: textoCancelar,
          variante: 'secundario',
          enfocar: peligrosa,
          deshabilitado: procesando,
          alPulsar: cancelar,
        },
        {
          texto: procesando ? textoProcesando : textoConfirmar,
          variante: peligrosa ? 'peligro' : 'principal',
          enfocar: !peligrosa,
          deshabilitado: procesando,
          alPulsar: confirmar,
        },
      ]}
    >
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}

export default ModalConfirmacion;

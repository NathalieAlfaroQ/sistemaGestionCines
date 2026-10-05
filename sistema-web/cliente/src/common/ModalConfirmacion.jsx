import Modal from './Modal.jsx';

function ModalConfirmacion({
  mensaje,
  titulo,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligrosa = false,
  alConfirmar,
  alCancelar,
}) {
  return (
    <Modal
      titulo={titulo}
      mensaje={mensaje}
      alCerrar={alCancelar}
      botones={[
        { texto: textoCancelar, variante: 'secundario', enfocar: peligrosa, alPulsar: alCancelar },
        {
          texto: textoConfirmar,
          variante: peligrosa ? 'peligro' : 'principal',
          enfocar: !peligrosa,
          alPulsar: alConfirmar,
        },
      ]}
    />
  );
}

export default ModalConfirmacion;

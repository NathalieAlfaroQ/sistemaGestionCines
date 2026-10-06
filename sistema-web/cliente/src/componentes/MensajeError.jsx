import { HelperText } from 'flowbite-react';
import { clasesFormulario } from '../temas/temaFormulario.js';

function MensajeError({ mensaje }) {
  if (!mensaje) return null;

  return (
    <HelperText role="alert" className={clasesFormulario.error}>
      {mensaje}
    </HelperText>
  );
}

export default MensajeError;
import { Label } from 'flowbite-react';
import { clasesFormulario } from '../temas/temaFormulario.js';
import MensajeError from './MensajeError.jsx';

function Campo({ id, etiqueta, obligatorio = false, error = null, className = '', children }) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {etiqueta} {obligatorio && <span className={clasesFormulario.acento}>*</span>}
      </Label>
      {children}
      <MensajeError mensaje={error} />
    </div>
  );
}

export default Campo;
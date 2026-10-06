import { Label } from 'flowbite-react';
import { clasesFormulario } from '../temas/temaFormulario.js';

function Campo({ id, etiqueta, obligatorio = false, children }) {
  return (
    <div>
      <Label htmlFor={id}>
        {etiqueta} {obligatorio && <span className={clasesFormulario.acento}>*</span>}
      </Label>
      {children}
    </div>
  );
}

export default Campo;
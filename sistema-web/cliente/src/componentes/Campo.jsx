import { Label } from 'flowbite-react';

function Campo({ id, etiqueta, obligatorio = false, children }) {
  return (
    <div>
      <Label htmlFor={id}>
        {etiqueta} {obligatorio && <span className="text-brand-soft">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default Campo;
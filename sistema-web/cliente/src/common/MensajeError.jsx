import { IconoEquis } from './iconos.jsx';

function MensajeError({ mensaje, id, className = '' }) {
  if (!mensaje) return null;

  return (
    <p id={id} role="alert" className={`mt-2 flex items-center gap-2 text-sm text-danger ${className}`.trim()}>
      <IconoEquis className="h-4 w-4 shrink-0" />
      <span>{mensaje}</span>
    </p>
  );
}

export default MensajeError;

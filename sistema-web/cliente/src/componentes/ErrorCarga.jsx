import { TIPOS_ERROR } from '../servicios/servicioReserva.js';

function ErrorCarga({ error, alReintentar, className = '' }) {
  if (!error) return null;

  const mensaje = typeof error === 'string' ? error : error.message;
  const puedeReintentar = typeof error !== 'string' && error.tipo === TIPOS_ERROR.conexion && alReintentar;

  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-4 rounded-lg border border-danger bg-surface px-6 py-4 ${className}`.trim()}
    >
      <p className="flex-1 text-danger">{mensaje}</p>
      {puedeReintentar && (
        <button
          type="button"
          onClick={alReintentar}
          className="rounded-md bg-brand px-4 py-2 text-sm text-text-color hover:bg-brand-hover"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export default ErrorCarga;

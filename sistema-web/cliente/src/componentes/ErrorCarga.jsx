import { TIPOS_ERROR } from '../servicios/servicioReserva.js';

function ErrorCarga({ error, alReintentar }) {
  const puedeReintentar = error.tipo === TIPOS_ERROR.conexion && alReintentar;

  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 rounded-lg border border-danger bg-surface px-6 py-4">
      <p className="flex-1 text-danger">{error.message}</p>
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
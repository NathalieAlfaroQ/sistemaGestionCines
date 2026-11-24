import { useHistorialCompras } from '../ganchos/useHistorialCompras.js';
import { POS_COMPRA } from '../constantes/posicionesHistorialCompras.js';
import Boton from '../common/Boton.jsx';
import ErrorCarga from './ErrorCarga.jsx';

const formateadorFecha = new Intl.DateTimeFormat('es-CR', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// '2026-07-17' -> '17 Julio 2026'
function formatearDia(dia) {
  const partes = Object.fromEntries(
    formateadorFecha.formatToParts(new Date(`${dia}T12:00:00Z`)).map(({ type, value }) => [type, value]),
  );
  const mes = partes.month.charAt(0).toUpperCase() + partes.month.slice(1);
  return `${partes.day} ${mes} ${partes.year}`;
}

// '2026-07-17 21:00' -> '17 Julio 2026, 21:00'
function formatearFechaHora(fechaHora) {
  const [dia, hora] = fechaHora.split(' ');
  return `${formatearDia(dia)}, ${hora}`;
}

function HistorialCompras() {
  const { compras, cargando, error, recargar } = useHistorialCompras();

  return (
    <section className="w-full max-w-3xl" aria-labelledby="titulo-historial">
      <h2 id="titulo-historial" className="mb-5 text-2xl text-text-color">Historial de compras</h2>

      {cargando && <p className="text-sm text-text-muted">Cargando compras...</p>}
      <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />

      {!cargando && !error && compras.length === 0 && (
        <p className="text-sm text-text-muted">Aún no has realizado compras</p>
      )}

      <ul className="flex flex-col gap-4">
        {compras.map((compra) => (
          <li key={compra[POS_COMPRA.id]} className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4 sm:flex-nowrap sm:px-6">
            {compra[POS_COMPRA.urlPoster] ? (
              <img
                src={compra[POS_COMPRA.urlPoster]}
                alt={`Póster de ${compra[POS_COMPRA.titulo]}`}
                className="aspect-[2/3] w-16 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="aspect-[2/3] w-16 shrink-0 rounded-md bg-border" aria-hidden="true" />
            )}

            <div className="flex flex-1 flex-col gap-1 text-sm text-text-muted">
              <p className="text-base text-text-color">{compra[POS_COMPRA.titulo]}</p>
              <p>Proyección: {formatearFechaHora(compra[POS_COMPRA.fechaFuncion])}</p>
              <p>Compra: {formatearDia(compra[POS_COMPRA.fechaCompra].split(' ')[0])}</p>
            </div>

            {/* Para conectar la cancelación: agregar aquí el onClick cuando esté lista esa función */}
            <Boton tamano="sm" className="w-full sm:w-auto">
              Cancelar orden
            </Boton>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HistorialCompras;

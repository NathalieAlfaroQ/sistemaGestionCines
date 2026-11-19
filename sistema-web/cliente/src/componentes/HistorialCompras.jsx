import { useHistorialCompras } from '../ganchos/useHistorialCompras.js';
import { POS_COMPRA } from '../constantes/posicionesHistorialCompras.js';
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
    <section className="historial" aria-labelledby="titulo-historial">
      <h2 id="titulo-historial" className="historial-titulo">Historial de compras</h2>

      {cargando && <p className="historial-vacio">Cargando compras...</p>}
      <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />

      {!cargando && !error && compras.length === 0 && (
        <p className="historial-vacio">Aún no has realizado compras</p>
      )}

      <ul className="historial-lista">
        {compras.map((compra) => (
          <li key={compra[POS_COMPRA.id]} className="historial-tarjeta">
            {compra[POS_COMPRA.urlPoster] ? (
              <img
                src={compra[POS_COMPRA.urlPoster]}
                alt={`Póster de ${compra[POS_COMPRA.titulo]}`}
                className="historial-poster"
              />
            ) : (
              <div className="historial-poster historial-poster-vacio" aria-hidden="true" />
            )}

            <div className="historial-datos">
              <p className="historial-pelicula">{compra[POS_COMPRA.titulo]}</p>
              <p>Proyección: {formatearFechaHora(compra[POS_COMPRA.fechaFuncion])}</p>
              <p>Compra: {formatearDia(compra[POS_COMPRA.fechaCompra].split(' ')[0])}</p>
            </div>

            {/* Para conectar la cancelación: agregar aquí el onClick cuando esté lista esa función */}
            <button type="button" className="historial-cancelar">
              Cancelar orden
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HistorialCompras;

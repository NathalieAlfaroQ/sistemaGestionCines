import { useState } from 'react';
import { useHistorialCompras } from '../ganchos/useHistorialCompras.js';
import { useNotificaciones } from '../ganchos/useNotificaciones.js';
import { ESTADOS_COMPRA, POS_COMPRA } from '../constantes/posicionesHistorialCompras.js';
import { cancelarCompra } from '../servicios/servicioHistorialCompras.js';
import { TIPOS_ERROR } from '../servicios/servicioReserva.js';
import { formatearColones } from '../utilidades/formatearColones.js';
import Boton from '../common/Boton.jsx';
import Modal from '../common/Modal.jsx';
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

// Mensaje cuando la cancelación terminó bien: el dinero vuelve por el mismo medio con que se pagó
function mensajeCancelacion({ monto, metodo, correoEnviado }) {
  const destino = metodo === 'PayPal' ? 'a tu cuenta de PayPal' : 'a la tarjeta con la que pagaste';
  const reembolso = monto > 0 ? ` Te devolvimos ${formatearColones(monto)} ${destino}.` : '';
  const correo = correoEnviado
    ? ' Te enviamos la confirmación por correo.'
    : ' No pudimos enviarte el correo de confirmación, pero la cancelación quedó registrada.';
  return `Cancelamos tu compra.${reembolso}${correo}`;
}

function HistorialCompras() {
  const { compras, cargando, error, recargar } = useHistorialCompras();
  const notificaciones = useNotificaciones();
  const [porCancelar, setPorCancelar] = useState(null); // la fila de la compra del modal
  const [cancelando, setCancelando] = useState(false);

  function cerrarModal() {
    // Mientras se procesa no se puede cerrar: el resultado llega igual y se avisa
    if (!cancelando) setPorCancelar(null);
  }

  async function confirmarCancelacion() {
    if (cancelando) return;
    setCancelando(true);
    try {
      const resultado = await cancelarCompra(porCancelar[POS_COMPRA.id]);
      if (resultado.correoEnviado) notificaciones.exito(mensajeCancelacion(resultado));
      else notificaciones.aviso(mensajeCancelacion(resultado));
      recargar();
    } catch (errorCancelacion) {
      notificaciones.error(errorCancelacion.message);
      // Ya estaba cancelada o se pasó del plazo: el historial que se ve está desactualizado
      if (errorCancelacion.tipo === TIPOS_ERROR.conflicto) recargar();
    } finally {
      setCancelando(false);
      setPorCancelar(null);
    }
  }

  return (
    <section className="w-full max-w-3xl" aria-labelledby="titulo-historial">
      <h2 id="titulo-historial" className="mb-5 text-2xl text-text-color">Historial de compras</h2>

      {cargando && <p className="text-sm text-text-muted">Cargando compras...</p>}
      <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />

      {!cargando && !error && compras.length === 0 && (
        <p className="text-sm text-text-muted">Aún no has realizado compras</p>
      )}

      <ul className="flex flex-col gap-4">
        {compras.map((compra) => {
          const cancelada = compra[POS_COMPRA.estado] === ESTADOS_COMPRA.cancelada;
          const puedeCancelar = compra[POS_COMPRA.puedeCancelar] === 1;

          return (
          <li
            key={compra[POS_COMPRA.id]}
            className={`flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4 sm:flex-nowrap sm:px-6 ${cancelada ? 'opacity-60' : ''}`.trim()}
          >
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

            {cancelada && (
              <span className="rounded-md border border-danger px-3 py-1 text-sm font-medium text-danger">Cancelada</span>
            )}

            {/* Solo se puede cancelar una compra activa hasta 5 días antes de la función (lo calcula el servidor) */}
            {!cancelada && puedeCancelar && (
              <Boton tamano="sm" variante="peligro" className="w-full sm:w-auto" onClick={() => setPorCancelar(compra)}>
                Cancelar orden
              </Boton>
            )}
          </li>
          );
        })}
      </ul>

      {porCancelar && (
        <Modal
          titulo="¿Cancelar esta compra?"
          mensaje={`Se cancelarán tus boletos para ${porCancelar[POS_COMPRA.titulo]} (${formatearFechaHora(porCancelar[POS_COMPRA.fechaFuncion])}) y te devolveremos ${formatearColones(porCancelar[POS_COMPRA.monto])} por el mismo medio con el que pagaste. Los boletos dejarán de ser válidos y esta acción no se puede deshacer.`}
          alCerrar={cerrarModal}
          botones={[
            {
              texto: cancelando ? 'Cancelando...' : 'Sí, cancelar compra',
              variante: 'peligro',
              deshabilitado: cancelando,
              alPulsar: confirmarCancelacion,
            },
            { texto: 'Volver', variante: 'secundario', enfocar: true, deshabilitado: cancelando, alPulsar: cerrarModal },
          ]}
        />
      )}
    </section>
  );
}

export default HistorialCompras;

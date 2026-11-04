import { POS_PROYECCION, POS_TIPO_BOLETO } from '../constantes/posicionesReserva.js';
import { formatearColones } from '../utilidades/moneda.js';
import { formatearFechaFuncion, formatearHora } from '../utilidades/fechas.js';

function CajaDato({ etiqueta, valor }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm">{etiqueta}</span>
      <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm">{valor}</span>
    </div>
  );
}

// Línea por tipo de boleto elegido: [{ nombre, cantidad, subtotal }]
function lineasBoletos(boletos, tiposBoleto) {
  return boletos.map(({ idTipoBoleto, cantidad }) => {
    const tipo = tiposBoleto.find((candidato) => candidato[POS_TIPO_BOLETO.id] === idTipoBoleto);
    return {
      idTipoBoleto,
      nombre: tipo?.[POS_TIPO_BOLETO.nombre] ?? 'Entrada',
      cantidad,
      subtotal: (tipo?.[POS_TIPO_BOLETO.precio] ?? 0) * cantidad,
    };
  });
}

// Columna izquierda de la pantalla de pago: función, asientos y detalle de la orden.
// El total que se muestra es informativo; el servidor lo vuelve a calcular al cobrar.
function ResumenCompra({ proyeccion, etiquetas, boletos, tiposBoleto, children }) {
  const fechaHora = proyeccion[POS_PROYECCION.fecha];
  const [dia] = formatearFechaFuncion(fechaHora).split(', ');
  const hora = formatearHora(fechaHora.split(' ')[1]);

  const lineas = lineasBoletos(boletos, tiposBoleto);
  const total = lineas.reduce((suma, linea) => suma + linea.subtotal, 0);

  return (
    <section aria-label="Resumen de la compra" className="flex flex-col gap-6 text-text-color">
      <div>
        <h2 className="text-xl font-bold">{proyeccion[POS_PROYECCION.sede]}</h2>
        <p className="text-sm text-brand-soft">
          {proyeccion[POS_PROYECCION.sala]} · {proyeccion[POS_PROYECCION.formato]}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <CajaDato etiqueta="Fecha" valor={dia} />
        <CajaDato etiqueta="Hora" valor={hora} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">Asientos seleccionados</span>
        <ul className="flex flex-wrap gap-2">
          {etiquetas.map((etiqueta) => (
            <li key={etiqueta} className="rounded-md border border-border bg-surface px-3 py-1 text-sm">
              {etiqueta}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Detalles de la orden</h3>
        <span className="text-sm text-brand-soft">Entradas</span>
        <dl className="flex flex-col gap-2 text-sm">
          {lineas.map((linea) => (
            <div key={linea.idTipoBoleto} className="flex justify-between">
              <dt>
                {linea.nombre} ({linea.cantidad})
              </dt>
              <dd>{formatearColones(linea.subtotal)}</dd>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold">
            <dt>TOTAL</dt>
            <dd>{formatearColones(total)}</dd>
          </div>
        </dl>
      </div>

      {children}
    </section>
  );
}

export default ResumenCompra;

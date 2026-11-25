import { useState } from 'react';
import { usePeliculasMasVistas, useRecaudacionPorPelicula, useSedesParaFiltro, useVentas } from '../ganchos/useEstadisticas.js';
import { POS_RANKING, POS_RECAUDACION, POS_SEDE_FILTRO, POS_VENTAS } from '../constantes/posicionesEstadistica.js';
import { claseDesplegable } from '../constantes/clasesFormulario.js';
import { formatearColones } from '../utilidades/formatearColones.js';
import GraficoBarras from '../componentes/GraficoBarras.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';

const claseSelector = `${claseDesplegable.replace('w-full', 'w-auto')} py-1.5 text-sm`;

const AGRUPACIONES = [
  { valor: 'trimestre', texto: 'Por trimestre' },
  { valor: 'anio', texto: 'Por año' },
];

const PERIODOS = [
  { valor: 'semana', texto: 'Esta semana' },
  { valor: 'mes', texto: 'Este mes' },
  { valor: 'trimestre', texto: 'Este trimestre' },
  { valor: 'anio', texto: 'Este año' },
];

// La recaudación se ve por semana, mes y año
const PERIODOS_RECAUDACION = PERIODOS.filter(({ valor }) => valor !== 'trimestre');

const TEXTO_PERIODO = { semana: 'esta semana', mes: 'este mes', trimestre: 'este trimestre', anio: 'este año' };

// Colones sin decimales
const formatoEjeColones = (valor) =>
  `₡${new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 }).format(valor)}`;
const formatoColones = (valor) => formatearColones(Math.round(valor));

const textoBoletos = (cantidad) => `${cantidad} ${cantidad === 1 ? 'boleto' : 'boletos'}`;
const formatoCantidad = (cantidad) => new Intl.NumberFormat('es-CR').format(cantidad);

// El eje de boletos solo marca enteros por limitaciones de Apexcharts
const formatoEjeBoletos = (valor) => (Number.isInteger(valor) ? String(valor) : '');

// Los años entre los que se puede ver el desglose por trimestre son el actual y los cuatro anteriores
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, indice) => ANIO_ACTUAL - indice);

function TarjetaGrafico({ titulo, subtitulo, controles, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{titulo}</h2>
          <p className="text-sm text-text-muted">{subtitulo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{controles}</div>
      </div>
      {children}
    </section>
  );
}

function DatoDestacado({ titulo, valor }) {
  return (
    <div className="rounded-lg bg-background px-4 py-3">
      <p className="text-sm text-text-muted">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  );
}

function TarjetaVentas({ idSede }) {
  const [agrupar, setAgrupar] = useState('trimestre');
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const { ventas, cargando, error, recargar } = useVentas({ agrupar, anio: agrupar === 'trimestre' ? anio : '', idSede });

  const ingresos = ventas.reduce((suma, fila) => suma + fila[POS_VENTAS.ingresos], 0);
  const cobertura = agrupar === 'trimestre' ? `de ${anio}` : 'de los últimos cinco años';

  return (
    <TarjetaGrafico
      titulo="Ventas"
      subtitulo={cargando ? 'Cargando ventas...' : `Ingresos ${cobertura}`}
      controles={
        <>
          <select aria-label="Agrupar ventas" className={claseSelector} value={agrupar} onChange={(evento) => setAgrupar(evento.target.value)}>
            {AGRUPACIONES.map(({ valor, texto }) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
          {agrupar === 'trimestre' && (
            <select aria-label="Año de las ventas" className={claseSelector} value={anio} onChange={(evento) => setAnio(Number(evento.target.value))}>
              {ANIOS.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          )}
        </>
      }
    >
      <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />
      {!error && !cargando && (
        <div className="mb-4">
          <DatoDestacado titulo="Ingresos" valor={formatoColones(ingresos)} />
        </div>
      )}
      {!error && !cargando && (
        <GraficoBarras
          categorias={ventas.map((fila) => fila[POS_VENTAS.etiqueta])}
          valores={ventas.map((fila) => fila[POS_VENTAS.ingresos])}
          nombreSerie="Ingresos"
          formatoEje={formatoEjeColones}
          formatoValor={formatoColones}
          detalle={(indice) => textoBoletos(ventas[indice][POS_VENTAS.boletos])}
          textoVacio="No hay ventas en este periodo"
        />
      )}
    </TarjetaGrafico>
  );
}

function TarjetaPeliculas({ idSede }) {
  const [periodo, setPeriodo] = useState('mes');
  const { ranking, cargando, error, recargar } = usePeliculasMasVistas({ periodo, idSede });

  const masVista = ranking[0];
  const totalBoletos = masVista ? masVista[POS_RANKING.totalBoletos] : 0;
  let subtitulo = 'Boletos vendidos por película';
  if (cargando) {
    subtitulo = 'Cargando películas...';
  } else if (masVista) {
    subtitulo = `Más vista: ${masVista[POS_RANKING.titulo]} (${textoBoletos(masVista[POS_RANKING.boletos])})`;
  }

  return (
    <TarjetaGrafico
      titulo="Película más vista"
      subtitulo={subtitulo}
      controles={
        <select aria-label="Periodo de la película más vista" className={claseSelector} value={periodo} onChange={(evento) => setPeriodo(evento.target.value)}>
          {PERIODOS.map(({ valor, texto }) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      }
    >
      <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />
      {!error && !cargando && (
        <div className="mb-4">
          <DatoDestacado titulo={`Boletos vendidos ${TEXTO_PERIODO[periodo]}`} valor={formatoCantidad(totalBoletos)} />
        </div>
      )}
      {!error && !cargando && (
        <GraficoBarras
          horizontal
          categorias={ranking.map((fila) => fila[POS_RANKING.titulo])}
          valores={ranking.map((fila) => fila[POS_RANKING.boletos])}
          nombreSerie="Boletos"
          formatoEje={formatoEjeBoletos}
          formatoValor={textoBoletos}
          textoVacio="No hay boletos vendidos en este periodo"
        />
      )}
    </TarjetaGrafico>
  );
}

function TarjetaRecaudacion({ idSede }) {
  const [periodo, setPeriodo] = useState('mes');
  const { ranking, cargando, error, recargar } = useRecaudacionPorPelicula({ periodo, idSede });

  const masRecaudo = ranking[0];
  let subtitulo = 'Recaudación por película';
  if (cargando) {
    subtitulo = 'Cargando recaudación...';
  } else if (masRecaudo) {
    subtitulo = `Mayor recaudación: ${masRecaudo[POS_RECAUDACION.titulo]} (${formatoColones(masRecaudo[POS_RECAUDACION.ingresos])})`;
  }

  return (
    <TarjetaGrafico
      titulo="Recaudación por película"
      subtitulo={subtitulo}
      controles={
        <select aria-label="Periodo de la recaudación" className={claseSelector} value={periodo} onChange={(evento) => setPeriodo(evento.target.value)}>
          {PERIODOS_RECAUDACION.map(({ valor, texto }) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      }
    >
      <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />
      {!error && !cargando && (
        <GraficoBarras
          horizontal
          categorias={ranking.map((fila) => fila[POS_RECAUDACION.titulo])}
          valores={ranking.map((fila) => fila[POS_RECAUDACION.ingresos])}
          nombreSerie="Recaudación"
          formatoEje={formatoEjeColones}
          formatoValor={formatoColones}
          detalle={(indice) => textoBoletos(ranking[indice][POS_RECAUDACION.boletos])}
          textoVacio="No hay ventas en este periodo"
        />
      )}
    </TarjetaGrafico>
  );
}

function Estadisticas() {
  const [idSede, setIdSede] = useState('');
  const { sedes, error: errorSedes, recargar: recargarSedes } = useSedesParaFiltro();

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="mx-auto max-w-screen-2xl px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-bold">Dashboard</h1>

          <select aria-label="Cine" className={claseSelector} value={idSede} onChange={(evento) => setIdSede(evento.target.value)}>
            <option value="">Todos los cines</option>
            {sedes.map((sede) => (
              <option key={sede[POS_SEDE_FILTRO.id]} value={sede[POS_SEDE_FILTRO.id]}>
                {sede[POS_SEDE_FILTRO.nombre]}
              </option>
            ))}
          </select>
        </div>

        <ErrorCarga error={errorSedes} alReintentar={recargarSedes} className="mb-4" />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TarjetaVentas idSede={idSede} />
          <TarjetaPeliculas idSede={idSede} />
          <TarjetaRecaudacion idSede={idSede} />
        </div>
      </div>
    </main>
  );
}

export default Estadisticas;
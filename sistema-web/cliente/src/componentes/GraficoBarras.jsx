import Chart from 'react-apexcharts';

// Los colores salen de los tokens del tema (src/index.css); ApexCharts necesita el valor, no la variable
const colorDelTema = (variable, respaldo) =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || respaldo;

const COLOR_TEXTO_EJES = '#c9c9d4';

// Gráfico de barras (ApexCharts, la librería de los gráficos de Flowbite)
//   categorias: una etiqueta por barra;
//   valores: un número por barra
//   formatoEje / formatoValor: cómo se escribe un valor en el eje y en el detalle al pasar el cursor
//   detalle(indice): texto extra opcional para el detalle de una barra
//   horizontal: barras horizontales (la primera categoría queda arriba)
function GraficoBarras({
  categorias,
  valores,
  nombreSerie,
  formatoEje = String,
  formatoValor = String,
  detalle,
  horizontal = false,
  alto = 280,
  textoVacio = 'No hay datos en este periodo',
}) {
  if (valores.length === 0 || valores.every((valor) => valor === 0)) {
    return (
      <div className="flex items-center justify-center text-text-muted" style={{ height: alto }}>
        {textoVacio}
      </div>
    );
  }

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', foreColor: COLOR_TEXTO_EJES, fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    colors: [colorDelTema('--color-brand-hover', '#7b48a0')],
    plotOptions: { bar: { horizontal, borderRadius: 6, columnWidth: '45%', barHeight: '55%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: colorDelTema('--color-border', '#565669'), strokeDashArray: 4 },
    xaxis: {
      categories: categorias,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { formatter: horizontal ? formatoEje : undefined },
    },
    yaxis: { labels: { formatter: horizontal ? undefined : formatoEje, maxWidth: 170 } },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (valor, { dataPointIndex }) =>
          detalle ? `${formatoValor(valor)} · ${detalle(dataPointIndex)}` : formatoValor(valor),
      },
    },
  };

  return <Chart type="bar" height={alto} options={options} series={[{ name: nombreSerie, data: valores }]} />;
}

export default GraficoBarras;

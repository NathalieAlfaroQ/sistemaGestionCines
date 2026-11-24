import { ejecutar } from '../configuracion/baseDatos.js';

const TIPO_DETALLE_BOLETO = 'BOLETO';

// Cuántas películas muestra el ranking
export const LIMITE_RANKING = 5;

const desdeBoletosVendidos = `
  FROM FACTURAS_FINALES f
  JOIN DETALLES_FACTURA df ON df.ID_FACTURA = f.ID_FACTURA AND df.TIPO_FACTURA = '${TIPO_DETALLE_BOLETO}'
  JOIN PROYECCIONES p ON p.ID_PROYECCION = df.ID_PROYECCION
  JOIN PELICULAS pe ON pe.ID_PELICULA = p.ID_PELICULA
  JOIN SALAS s ON s.ID_SALA = p.ID_SALA
  WHERE f.FECHA >= TO_DATE(:desde, 'YYYY-MM-DD')
    AND f.FECHA < TO_DATE(:hasta, 'YYYY-MM-DD')
    AND (:idSede IS NULL OR s.ID_SEDE = :idSede)
`;

// Las expresiones de agrupación son fijas: nunca se arman con datos del usuario
const AGRUPACIONES = {
  trimestre: `TO_CHAR(f.FECHA, 'Q')`,
  anio: `TO_CHAR(f.FECHA, 'YYYY')`,
};

// Cada fila: periodo ('1' a '4' o el año), ingresos (suma de lo cobrado por boleto) y boletos vendidos
export async function ventasPorPeriodo({ agrupacion, desde, hasta, idSede = null }) {
  const expresion = AGRUPACIONES[agrupacion];
  if (!expresion) throw new Error(`Agrupación desconocida: ${agrupacion}`);

  const resultado = await ejecutar(
    `SELECT ${expresion} AS PERIODO, SUM(df.MONTO) AS INGRESOS, COUNT(*) AS BOLETOS
     ${desdeBoletosVendidos}
     GROUP BY ${expresion}
     ORDER BY ${expresion}`,
    { desde, hasta, idSede },
  );
  return resultado.rows;
}

export async function peliculasMasVistas({ desde, hasta, idSede = null }) {
  const resultado = await ejecutar(
    `SELECT pe.ID_PELICULA, pe.TITULO, COUNT(*) AS BOLETOS, SUM(COUNT(*)) OVER () AS TOTAL_BOLETOS
     ${desdeBoletosVendidos}
     GROUP BY pe.ID_PELICULA, pe.TITULO
     ORDER BY BOLETOS DESC, pe.TITULO
     FETCH FIRST ${LIMITE_RANKING} ROWS ONLY`,
    { desde, hasta, idSede },
  );
  return resultado.rows;
}
export async function recaudacionPorPelicula({ desde, hasta, idSede = null }) {
  const resultado = await ejecutar(
    `SELECT pe.ID_PELICULA, pe.TITULO, SUM(df.MONTO) AS INGRESOS, COUNT(*) AS BOLETOS, SUM(SUM(df.MONTO)) OVER () AS TOTAL_INGRESOS
     ${desdeBoletosVendidos}
     GROUP BY pe.ID_PELICULA, pe.TITULO
     ORDER BY INGRESOS DESC, pe.TITULO
     FETCH FIRST ${LIMITE_RANKING} ROWS ONLY`,
    { desde, hasta, idSede },
  );
  return resultado.rows;
}

// Cines entre los que se puede filtrar (los activos)
const sqlSedesParaFiltro = `SELECT ID_SEDE, NOMBRE_SEDE FROM SEDES WHERE ESTADO_SEDE = 1 ORDER BY NOMBRE_SEDE`;

export async function listarSedesParaFiltro() {
  const resultado = await ejecutar(sqlSedesParaFiltro);
  return resultado.rows;
}
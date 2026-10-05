import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react';

const claseEncabezado = 'px-4 py-3 bg-transparent text-base font-normal normal-case text-text-color';
const claseCelda = 'px-4 py-3 text-text-color';
const claseBotonPagina =
  'min-w-9 h-9 px-3 rounded-lg border border-border text-text-color transition-colors ' +
  'hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed';

function elementosDePaginacion(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set([1, total, actual - 1, actual, actual + 1]);
  if (actual <= 3) [2, 3, 4].forEach((n) => paginas.add(n));
  if (actual >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => paginas.add(n));

  const ordenadas = [...paginas].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const elementos = [];

  ordenadas.forEach((n, i) => {
    const anterior = ordenadas[i - 1];
    if (i > 0 && n - anterior === 2) elementos.push(anterior + 1);
    if (i > 0 && n - anterior > 2) elementos.push(`salto-${n}`);
    elementos.push(n);
  });

  return elementos;
}

function IconoEditar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function IconoEliminar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function Tabla({
  columnas,
  filas,
  posicionId = 0,
  textoVacio = 'No hay datos para mostrar en este momento',
  numerada = true,
  onEditar,
  onEliminar,
  opcionesPorPagina = [8, 16, 24, 40],
  porPaginaInicial = 8,
}) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);

  const [filasPrevias, setFilasPrevias] = useState(filas);
  if (filas !== filasPrevias) {
    setFilasPrevias(filas);
    setPagina(1);
  }

  if (filas.length === 0) {
    return <p className="text-danger">{textoVacio}</p>;
  }

  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const filasVisibles = filas.slice(inicio, inicio + porPagina);
  const tieneAcciones = Boolean(onEditar || onEliminar);

  function cambiarPorPagina(evento) {
    setPorPagina(Number(evento.target.value));
    setPagina(1);
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table className="bg-transparent">
          <TableHead>
            <TableRow className="border-b border-border">
              {numerada && <TableHeadCell className={claseEncabezado}>##</TableHeadCell>}
              {columnas.map((columna) => (
                <TableHeadCell key={columna.titulo} className={claseEncabezado}>
                  {columna.titulo}
                </TableHeadCell>
              ))}
              {tieneAcciones && <TableHeadCell className={claseEncabezado}>Acciones</TableHeadCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {filasVisibles.map((fila, indice) => (
              <TableRow
                key={fila[posicionId]}
                className="border-b border-border/40 bg-transparent hover:bg-surface"
              >
                {numerada && <TableCell className={claseCelda}>{inicio + indice + 1}</TableCell>}
                {columnas.map((columna) => {
                  const valor = fila[columna.posicion];
                  return (
                    <TableCell key={columna.titulo} className={claseCelda}>
                      {columna.formato ? columna.formato(valor, fila) : valor}
                    </TableCell>
                  );
                })}
                {tieneAcciones && (
                  <TableCell className={claseCelda}>
                    <div className="flex gap-2">
                      {onEditar && (
                        <button
                          type="button"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => onEditar(fila)}
                          className="p-2 rounded-lg border border-brand-soft text-brand-soft transition-colors hover:bg-brand-hover hover:text-text-color"
                        >
                          <IconoEditar />
                        </button>
                      )}
                      {onEliminar && (
                        <button
                          type="button"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => onEliminar(fila)}
                          className="p-2 rounded-lg border border-danger text-danger transition-colors hover:bg-danger hover:text-text-color"
                        >
                          <IconoEliminar />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-text-color">
        <label className="flex items-center gap-2">
          Filas por página
          <select
            value={porPagina}
            onChange={cambiarPorPagina}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-text-color"
          >
            {opcionesPorPagina.map((cantidad) => (
              <option key={cantidad} value={cantidad}>
                {cantidad}
              </option>
            ))}
          </select>
        </label>

        {totalPaginas > 1 && (
          <nav aria-label="Paginación" className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={claseBotonPagina}
              disabled={paginaActual === 1}
              onClick={() => setPagina(paginaActual - 1)}
            >
              Anterior
            </button>

            {elementosDePaginacion(paginaActual, totalPaginas).map((elemento) =>
              typeof elemento === 'number' ? (
                <button
                  key={elemento}
                  type="button"
                  aria-current={elemento === paginaActual ? 'page' : undefined}
                  className={
                    elemento === paginaActual
                      ? 'min-w-9 h-9 px-3 rounded-lg border border-brand-soft bg-brand text-text-color'
                      : claseBotonPagina
                  }
                  onClick={() => setPagina(elemento)}
                >
                  {elemento}
                </button>
              ) : (
                <span key={elemento} className="px-1 text-text-muted">
                  …
                </span>
              )
            )}

            <button
              type="button"
              className={claseBotonPagina}
              disabled={paginaActual === totalPaginas}
              onClick={() => setPagina(paginaActual + 1)}
            >
              Siguiente
            </button>
          </nav>
        )}

        <p>
          Exhibiendo {inicio + 1}-{inicio + filasVisibles.length} de {filas.length} registros
        </p>
      </div>
    </div>
  );
}

export default Tabla;

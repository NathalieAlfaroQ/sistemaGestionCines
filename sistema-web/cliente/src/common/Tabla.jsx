import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react';
import Boton from './Boton.jsx';
import { IconoEditar, IconoEliminar } from './iconos.jsx';

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

const claseFiltro =
  'rounded border border-brand-soft bg-transparent py-1.5 pl-3 pr-8 text-xs font-medium text-brand-soft ' +
  'transition-colors hover:bg-brand-soft/10 focus:border-brand-soft focus:ring-brand-soft ' +
  'disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-surface [&>option]:text-text-color';

function FiltroColumna({ columna, valor, alCambiar }) {
  const {
    clave,
    tipo = 'texto',
    opciones = [],
    opcionVacia = columna.titulo,
    deshabilitado = false,
    placeholder,
  } = columna.filtro;
  const etiqueta = `Filtrar por ${columna.titulo}`;

  if (tipo === 'seleccion') {
    return (
      <div className="relative">
        <select
          aria-label={etiqueta}
          className={`peer appearance-none bg-none ${claseFiltro}`}
          value={valor}
          disabled={deshabilitado}
          onChange={(evento) => alCambiar(clave, evento.target.value)}
        >
          {opcionVacia !== null && <option value="">{opcionVacia}</option>}
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-soft peer-disabled:opacity-50"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <input
      type="search"
      aria-label={etiqueta}
      className={`${claseFiltro} pr-3 placeholder:text-brand-soft/70`}
      placeholder={placeholder ?? columna.titulo}
      value={valor}
      disabled={deshabilitado}
      onChange={(evento) => alCambiar(clave, evento.target.value)}
    />
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
  accionesDeshabilitadas,
  filtros = {},
  alCambiarFiltros,
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

  const tieneFiltros = Boolean(alCambiarFiltros) && columnas.some((columna) => columna.filtro);
  const sinFilas = filas.length === 0;

  if (sinFilas && !tieneFiltros) {
    return <p className="text-danger">{textoVacio}</p>;
  }

  function cambiarFiltro(clave, valor) {
    alCambiarFiltros({ ...filtros, [clave]: valor });
  }

  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const filasVisibles = filas.slice(inicio, inicio + porPagina);
  const tieneAcciones = Boolean(onEditar || onEliminar);
  const totalColumnas = columnas.length + (numerada ? 1 : 0) + (tieneAcciones ? 1 : 0);

  function cambiarPorPagina(evento) {
    setPorPagina(Number(evento.target.value));
    setPagina(1);
  }

  return (
    <div>
      {tieneFiltros && (
        <div className="mb-8 flex flex-wrap items-center gap-4">
          {columnas
            .filter((columna) => columna.filtro)
            .map((columna) => (
              <FiltroColumna
                key={columna.titulo}
                columna={columna}
                valor={filtros[columna.filtro.clave] ?? ''}
                alCambiar={cambiarFiltro}
              />
            ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="bg-transparent">
          <TableHead>
            <TableRow className="border-b border-border">
              {numerada && <TableHeadCell className={claseEncabezado}></TableHeadCell>}
              {columnas.map((columna) => (
                <TableHeadCell key={columna.titulo} className={claseEncabezado}>
                  {columna.titulo}
                </TableHeadCell>
              ))}
              {tieneAcciones && <TableHeadCell className={claseEncabezado}>Acciones</TableHeadCell>}
            </TableRow>

          </TableHead>

          <TableBody>
            {sinFilas && (
              <TableRow className="bg-transparent">
                <TableCell colSpan={totalColumnas} className="px-4 py-6 text-center text-danger">
                  {textoVacio}
                </TableCell>
              </TableRow>
            )}
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
                        <Boton
                          variante="contorno"
                          tamano="icono"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => onEditar(fila)}
                          disabled={accionesDeshabilitadas?.(fila)}
                          className="disabled:hover:bg-transparent disabled:hover:text-brand-soft"
                        >
                          <IconoEditar />
                        </Boton>
                      )}
                      {onEliminar && (
                        <Boton
                          variante="contornoPeligro"
                          tamano="icono"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => onEliminar(fila)}
                          disabled={accionesDeshabilitadas?.(fila)}
                          className="disabled:hover:bg-transparent disabled:hover:text-danger"
                        >
                          <IconoEliminar />
                        </Boton>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!sinFilas && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-text-color">
          <label className="flex items-center gap-2">
            Filas por página {' '}
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
      )}
    </div>
  );
}

export default Tabla;

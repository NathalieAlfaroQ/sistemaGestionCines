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
                        <Boton
                          variante="contorno"
                          tamano="icono"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => onEditar(fila)}
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
    </div>
  );
}

export default Tabla;

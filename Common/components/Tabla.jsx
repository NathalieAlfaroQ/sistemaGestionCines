import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react';

const claseEncabezado = 'px-4 py-3 bg-transparent text-base font-normal normal-case text-white';
const claseCelda = 'px-4 py-3 text-white';

function Tabla({
  columnas,
  filas,
  posicionId = 0,
  textoVacio = 'No hay datos para mostrar en este momento',
  numerada = true,
}) {
  if (filas.length === 0) {
    return <p className="text-white">{textoVacio}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table hoverable className="bg-transparent">
        <TableHead>
          <TableRow className="border-b border-linea">
            {numerada && <TableHeadCell className={claseEncabezado}>##</TableHeadCell>}
            {columnas.map((columna) => (
              <TableHeadCell key={columna.titulo} className={claseEncabezado}>
                {columna.titulo}
              </TableHeadCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {filas.map((fila, indice) => (
            <TableRow
              key={fila[posicionId]}
              className="border-b border-white/10 bg-transparent hover:bg-white/5"
            >
              {numerada && <TableCell className={claseCelda}>{indice + 1}</TableCell>}
              {columnas.map((columna) => {
                const valor = fila[columna.posicion];
                return (
                  <TableCell key={columna.titulo} className={claseCelda}>
                    {columna.formato ? columna.formato(valor, fila) : valor}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Tabla;

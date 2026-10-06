import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import AccionesFila from './AccionesFila.jsx';

const claseEncabezado =
  'bg-transparent px-4 py-3 text-center text-base font-normal normal-case text-white dark:bg-transparent';
const claseCelda = 'px-4 py-3 text-center text-white';
const claseLinea = 'border-b border-[#B188CE]/50';

function TablaPeliculas({ peliculas, numeroInicial = 1, alVer, alEditar, alBorrar }) {
  if (peliculas.length === 0) {
    return <p className="text-white">No hay películas para mostrar en este momento</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="bg-transparent">
        <TableHead>
          <TableRow className={claseLinea}>
            <TableHeadCell className={claseEncabezado}>##</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Título</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Género</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Duración</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Clasificación por edad</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>
              <span className="sr-only">Acciones</span>
            </TableHeadCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {peliculas.map((pelicula, indice) => (
            <TableRow
              key={pelicula[POS_PELICULA.id]}
              className={`${claseLinea} bg-transparent hover:bg-white/5`}
            >
              <TableCell className={claseCelda}>{numeroInicial + indice}</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.titulo]}</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.generos] ?? '—'}</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.duracion]} min</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.clasificacion]}</TableCell>
              <TableCell className={claseCelda}>
                <AccionesFila fila={pelicula} alVer={alVer} alEditar={alEditar} alBorrar={alBorrar} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TablaPeliculas;
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';

function TablaPeliculas({ peliculas }) {
  if (peliculas.length === 0) {
    return <p>No hay películas para mostrar en este momento</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <TableHead>
          <TableRow>
            <TableHeadCell>##</TableHeadCell>
            <TableHeadCell>Título</TableHeadCell>
            <TableHeadCell>Género</TableHeadCell>
            <TableHeadCell>Duración</TableHeadCell>
            <TableHeadCell>Clasificación por edad</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peliculas.map((pelicula, indice) => (
            <TableRow key={pelicula[POS_PELICULA.id]}>
              <TableCell>{indice + 1}</TableCell>
              <TableCell>{pelicula[POS_PELICULA.titulo]}</TableCell>
              <TableCell>{pelicula[POS_PELICULA.generos] ?? '—'}</TableCell>
              <TableCell>{pelicula[POS_PELICULA.duracion]}</TableCell>
              <TableCell>{pelicula[POS_PELICULA.clasificacion]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TablaPeliculas;
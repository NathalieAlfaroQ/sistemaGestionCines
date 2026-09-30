const claseEncabezado = 'px-4 py-3 bg-transparent text-base font-normal normal-case text-white';
const claseCelda = 'px-4 py-3 text-white';

function TablaPeliculas({ peliculas }) {
  if (peliculas.length === 0) {
    return <p className="text-white">No hay películas para mostrar en este momento</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table hoverable className="bg-transparent">
        <TableHead>
          <TableRow className="border-b border-linea">
            <TableHeadCell className={claseEncabezado}>##</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Título</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Género</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Duración</TableHeadCell>
            <TableHeadCell className={claseEncabezado}>Clasificación por edad</TableHeadCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {peliculas.map((pelicula, indice) => (
            <TableRow
              key={pelicula[POS_PELICULA.id]}
              className="border-b border-white/10 bg-transparent hover:bg-white/5"
            >
              <TableCell className={claseCelda}>{indice + 1}</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.titulo]}</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.generos] ?? '—'}</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.duracion]} min</TableCell>
              <TableCell className={claseCelda}>{pelicula[POS_PELICULA.clasificacion]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
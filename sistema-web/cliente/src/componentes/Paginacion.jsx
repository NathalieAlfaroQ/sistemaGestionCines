import { Label, Pagination, Select, ThemeProvider } from 'flowbite-react';
import { reemplazoPaginacion, temaPaginacion } from '../temas/temaPaginacion.js';

const OPCIONES_TAMANO = [8, 16, 24];

function Paginacion({
  paginaActual,
  totalPaginas,
  desde,
  hasta,
  total,
  tamano,
  alCambiarPagina,
  alCambiarTamano,
}) {
  if (total === 0) return null;

  return (
    <ThemeProvider theme={temaPaginacion}>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-2">
          <Label htmlFor="lineas-por-pagina">Líneas por página</Label>
          <Select
            id="lineas-por-pagina"
            sizing="sm"
            className="w-20"
            value={tamano}
            onChange={(evento) => alCambiarTamano(Number(evento.target.value))}
          >
            {OPCIONES_TAMANO.map((opcion) => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </Select>
        </div>

        <Pagination
          showIcons
          previousLabel="Anterior"
          nextLabel="Próximo"
          currentPage={paginaActual}
          totalPages={totalPaginas}
          onPageChange={alCambiarPagina}
          applyTheme={reemplazoPaginacion}
        />

        <p className="text-sm">
          Exhibiendo {desde}-{hasta} de {total} registros
        </p>
      </div>
    </ThemeProvider>
  );
}

export default Paginacion;
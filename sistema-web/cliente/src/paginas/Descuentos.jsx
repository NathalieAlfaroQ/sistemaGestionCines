import { useState } from 'react';
import { useDescuentos } from '../ganchos/useDescuento.js';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useSedes } from '../ganchos/useSedes.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { POS_DESCUENTO } from '../constantes/posicionesDescuento.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import { formatearHora } from '../utilidades/fechas.js';
import { formatearFecha } from '../utilidades/formatearFecha.js';
import Tabla from '../common/Tabla.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';
import CrearDescuento from '../componentes/CrearDescuento.jsx';
import { useNotificaciones } from '../ganchos/useNotificaciones.js';

const FILTROS_INICIALES = { idSede: '', idPelicula: '', fechaInicio: '', fechaFin: '' };

const claseBoton = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover';

const claseBarraBusqueda = 'mb-4 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-black placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft';

// Muestra "12/03/2026 8:00 AM" a partir de la fecha y la hora que vienen por separado
const fechaConHora = (posicionFecha, posicionHora) => (_valor, fila) =>
  `${formatearFecha(fila[posicionFecha])} ${formatearHora(fila[posicionHora])}`;

function Descuentos() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [creando, setCreando] = useState(false);
  const notificaciones = useNotificaciones();

  const { descuentos, cargando, error, recargar } = useDescuentos({
    busqueda: busquedaRetrasada,
    idSede: filtros.idSede,
    idPelicula: filtros.idPelicula,
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
  });

  const { sedes, error: errorSedes, recargar: recargarSedes } = useSedes({ estado: 'activas' });
  const { peliculas, error: errorPeliculas, recargar: recargarPeliculas } = usePeliculas();
  const errorCatalogo = errorSedes || errorPeliculas;

  function recargarCatalogo() {
    if (errorSedes) recargarSedes();
    if (errorPeliculas) recargarPeliculas();
  }

  function descuentoCreado() {
    setCreando(false);
    notificaciones.exito('Descuento creado con éxito');
    recargar();
  }

  const columnas = [
    {
      titulo: 'Cine',
      posicion: POS_DESCUENTO.cine,
      filtro: {
        clave: 'idSede',
        tipo: 'seleccion',
        opciones: sedes.map((sede) => ({ valor: String(sede[POS_SEDE.id]), texto: sede[POS_SEDE.nombre] })),
      },
    },
    { titulo: 'Nombre', posicion: POS_DESCUENTO.nombre },
    {
      titulo: 'Películas',
      posicion: POS_DESCUENTO.peliculas,
      formato: (titulos) => titulos ?? 'Ninguna',
      filtro: {
        clave: 'idPelicula',
        tipo: 'seleccion',
        opciones: peliculas.map((pelicula) => ({
          valor: String(pelicula[POS_PELICULA.id]),
          texto: pelicula[POS_PELICULA.titulo],
        })),
      },
    },
    { titulo: 'Descuento', posicion: POS_DESCUENTO.porcentaje, formato: (porcentaje) => `${porcentaje}%` },
    {
      titulo: 'Inicio',
      posicion: POS_DESCUENTO.fechaInicio,
      formato: fechaConHora(POS_DESCUENTO.fechaInicio, POS_DESCUENTO.horaInicio),
      filtro: { clave: 'fechaInicio', tipo: 'fecha' },
    },
    {
      titulo: 'Fin',
      posicion: POS_DESCUENTO.fechaFin,
      formato: fechaConHora(POS_DESCUENTO.fechaFin, POS_DESCUENTO.horaFin),
      filtro: { clave: 'fechaFin', tipo: 'fecha' },
    },
  ];

  const hayCriterios = busquedaRetrasada.trim() !== '' || Object.values(filtros).some((valor) => valor !== '');
  const textoVacio = hayCriterios
    ? 'No se encontraron descuentos con esos criterios'
    : 'No hay descuentos existentes';

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-4">
          <h1 className="text-4xl font-bold">Descuentos</h1>

          <button type="button" onClick={() => setCreando(true)} className={claseBoton}>
            Crear
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <input
          type="search"
          className={claseBarraBusqueda}
          placeholder="Buscar descuentos"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="mb-4 text-text-muted">Cargando descuentos...</p>}
        <ErrorCarga error={error} alReintentar={recargar} className="mb-4" />
        <ErrorCarga error={errorCatalogo} alReintentar={recargarCatalogo} className="mb-4" />

        {/* Si la carga falla no se muestra la tabla ni el mensaje de lista vacía */}
        {!error && (
          <Tabla
            columnas={columnas}
            filas={descuentos}
            posicionId={POS_DESCUENTO.id}
            filtros={filtros}
            alCambiarFiltros={setFiltros}
            textoVacio={cargando ? '' : textoVacio}
          />
        )}
      </div>

      {creando && <CrearDescuento alCancelar={() => setCreando(false)} alCrear={descuentoCreado} />}
    </main>
  );
}

export default Descuentos;

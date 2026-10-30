import { useState } from 'react';
import { useProyecciones } from '../ganchos/useProyecciones.js';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useSalas } from '../ganchos/useSalas.js';
import { useSedes } from '../ganchos/useSedes.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { POS_PROYECCION, ESTADO_PROYECCION } from '../constantes/posicionesProyeccion.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { POS_SALA } from '../constantes/posicionesSala.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import { formatearHora } from '../utilidades/fechas.js';
import Tabla from '../common/Tabla.jsx';

const OPCIONES_ESTADO = [
  { valor: 'activas', texto: 'Activas' },
  { valor: 'eliminadas', texto: 'Eliminadas' },
  { valor: 'todas', texto: 'Todas' },
];

const FILTROS_INICIALES = { idSede: '', idPelicula: '', fecha: '', hora: '', idSala: '', estado: 'activas' };

const claseBarraBusqueda = 'mb-4 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-black placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft';

// La API entrega la fecha como AAAA-MM-DD; se muestra como DD/MM/AAAA
const formatearFecha = (fecha) => fecha.split('-').reverse().join('/');

function Proyecciones() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const { proyecciones, cargando, error } = useProyecciones({
    busqueda: busquedaRetrasada,
    idPelicula: filtros.idPelicula,
    idSala: filtros.idSala,
    idSede: filtros.idSede,
    fecha: filtros.fecha,
    hora: filtros.hora,
    estado: filtros.estado,
  });

  const { peliculas, error: errorPeliculas } = usePeliculas();
  const { salas, error: errorSalas } = useSalas({ idSede: filtros.idSede, estado: 'activas' });
  const { sedes, error: errorSedes } = useSedes({ estado: 'activas' });
  const errorCatalogo = errorPeliculas || errorSalas || errorSedes;

  function cambiarFiltros(nuevosFiltros) {
    setFiltros(
      nuevosFiltros.idSede === filtros.idSede ? nuevosFiltros : { ...nuevosFiltros, idSala: '' },
    );
  }

  const columnas = [
    {
      titulo: 'Cine',
      posicion: POS_PROYECCION.cine,
      filtro: {
        clave: 'idSede',
        tipo: 'seleccion',
        opciones: sedes.map((sede) => ({
          valor: String(sede[POS_SEDE.id]),
          texto: sede[POS_SEDE.nombre],
        })),
      },
    },
    {
      titulo: 'Película',
      posicion: POS_PROYECCION.pelicula,
      filtro: {
        clave: 'idPelicula',
        tipo: 'seleccion',
        opciones: peliculas.map((pelicula) => ({
          valor: String(pelicula[POS_PELICULA.id]),
          texto: pelicula[POS_PELICULA.titulo],
        })),
      },
    },
    {
      titulo: 'Fecha',
      posicion: POS_PROYECCION.fecha,
      formato: formatearFecha,
      filtro: { clave: 'fecha', tipo: 'fecha' },
    },
    {
      titulo: 'Hora',
      posicion: POS_PROYECCION.hora,
      formato: formatearHora,
      filtro: { clave: 'hora', tipo: 'hora' },
    },
    {
      titulo: 'Sala',
      posicion: POS_PROYECCION.sala,
      filtro: {
        clave: 'idSala',
        tipo: 'seleccion',
        opciones: salas.map((sala) => ({
          valor: String(sala[POS_SALA.id]),
          texto: sala[POS_SALA.nombre],
        })),
      },
    },
    {
      titulo: 'Estado',
      posicion: POS_PROYECCION.estado,
      formato: (valor) => (valor === ESTADO_PROYECCION.activa ? 'Activa' : 'Eliminada'),
      filtro: { clave: 'estado', tipo: 'seleccion', opciones: OPCIONES_ESTADO, opcionVacia: null },
    },
  ];

  const hayFiltros =
    busquedaRetrasada.trim() !== '' ||
    Object.keys(FILTROS_INICIALES).some((clave) => filtros[clave] !== FILTROS_INICIALES[clave]);
  const textoVacio = hayFiltros
    ? 'No se encontraron proyecciones con esos criterios'
    : 'No hay proyecciones para mostrar en este momento';

  function verProyeccion() {}

  function editarProyeccion() {}

  function eliminarProyeccion() {}

  const proyeccionEliminada = (proyeccion) => proyeccion[POS_PROYECCION.estado] !== ESTADO_PROYECCION.activa;

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5">
          <h1 className="text-4xl font-bold">Proyecciones</h1>
        </div>

        <input
          type="search"
          className={claseBarraBusqueda}
          placeholder="Buscar proyecciones"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="mb-4 text-text-muted">Cargando proyecciones...</p>}
        {error && <p className="mb-4 text-warning">{error}</p>}
        {errorCatalogo && <p className="mb-4 text-warning">{errorCatalogo}</p>}

        <Tabla
          columnas={columnas}
          filas={proyecciones}
          posicionId={POS_PROYECCION.id}
          filtros={filtros}
          alCambiarFiltros={cambiarFiltros}
          textoVacio={cargando ? '' : textoVacio}
          onVer={verProyeccion}
          onEditar={editarProyeccion}
          onEliminar={eliminarProyeccion}
          accionesDeshabilitadas={proyeccionEliminada}
        />
      </div>
    </main>
  );
}

export default Proyecciones;

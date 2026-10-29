import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePeliculaCartelera } from '../ganchos/usePeliculaCartelera.js';
import { useHorarios } from '../ganchos/useHorarios.js';
import { generarDias } from '../utilidades/fechas.js';
import { agruparHorarios, formatosDe, sedesDe } from '../utilidades/horarios.js';
import EncabezadoPelicula from '../componentes/EncabezadoPelicula.jsx';
import SelectorFechas from '../componentes/SelectorFechas.jsx';
import FiltrosFunciones from '../componentes/FiltrosFunciones.jsx';
import TarjetaSede from '../componentes/TarjetaSede.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';
import ContenedorCliente from '../componentes/ContenedorCliente.jsx';

const DIAS_SELECCIONABLES = 10;
const SIN_FILTROS = { idSede: '', idFormato: '' };

function filtroValido(valor, opciones) {
  return opciones.some((opcion) => String(opcion.id) === valor) ? valor : '';
}

// Pantalla 1 de SCRUM-93: horarios de una película por día, cine y formato
function HorariosPelicula() {
  const { idPelicula } = useParams();
  const navegar = useNavigate();

  const dias = useMemo(() => generarDias(DIAS_SELECCIONABLES), []);
  const [fecha, setFecha] = useState(dias[0].valor);
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [idSeleccionado, setIdSeleccionado] = useState(null);

  const pelicula = usePeliculaCartelera(idPelicula);
  const { horarios, cargando: cargandoHorarios, error: errorHorarios, recargar: recargarHorarios } = useHorarios(
    idPelicula,
    fecha
  );

  const sedes = useMemo(() => sedesDe(horarios), [horarios]);
  const formatos = useMemo(() => formatosDe(horarios), [horarios]);
  const filtrosAplicados = {
    idSede: filtroValido(filtros.idSede, sedes),
    idFormato: filtroValido(filtros.idFormato, formatos),
  };
  const sedesAgrupadas = agruparHorarios(horarios, filtrosAplicados);

  function cambiarFecha(nuevaFecha) {
    setFecha(nuevaFecha);
    setIdSeleccionado(null);
  }

  function cambiarFiltros(nuevosFiltros) {
    setFiltros(nuevosFiltros);
    setIdSeleccionado(null);
  }

  function continuar(idProyeccion) {
    void navegar(`/funciones/${idProyeccion}/asientos`);
  }

  // Sin encabezado no hay pantalla: se muestra la carga o el error de la película
  if (!pelicula.detalle) {
    return (
      <main className="min-h-screen bg-background py-12 text-text-color">
        <ContenedorCliente>
          {pelicula.error ? (
            <ErrorCarga error={pelicula.error} alReintentar={pelicula.recargar} />
          ) : (
            <p>Cargando película...</p>
          )}
        </ContenedorCliente>
      </main>
    );
  }

  function contenidoHorarios() {
    if (errorHorarios) return <ErrorCarga error={errorHorarios} alReintentar={recargarHorarios} />;
    if (cargandoHorarios) return <p className="text-text-color">Cargando horarios...</p>;
    if (sedesAgrupadas.length === 0) {
      return <p className="rounded-lg bg-surface px-6 py-5 text-text-color">No hay funciones disponibles para este día.</p>;
    }

    return sedesAgrupadas.map((sede) => (
      <TarjetaSede
        key={sede.idSede}
        sede={sede}
        idSeleccionado={idSeleccionado}
        alSeleccionar={setIdSeleccionado}
        alContinuar={continuar}
      />
    ));
  }

  return (
    <main className="min-h-screen bg-background">
      <EncabezadoPelicula detalle={pelicula.detalle} />

      <ContenedorCliente className="py-10 flex flex-col gap-8">
        <div className="max-w-4xl w-full mx-auto">
          <SelectorFechas dias={dias} seleccionada={fecha} alSeleccionar={cambiarFecha} />
        </div>

        <FiltrosFunciones sedes={sedes} formatos={formatos} filtros={filtrosAplicados} alCambiar={cambiarFiltros} />

        <div className="flex flex-col gap-8">{contenidoHorarios()}</div>
      </ContenedorCliente>
    </main>
  );
}

export default HorariosPelicula;
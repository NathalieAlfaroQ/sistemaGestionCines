import { useState } from 'react';
import { useSalas } from '../ganchos/useSalas.js';
import { useSedes } from '../ganchos/useSedes.js';
import { useCatalogoSala } from '../ganchos/useCatalogoSala.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { POS_SALA, POS_CATALOGO_SALA, ESTADO_SALA } from '../constantes/posicionesSala.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import Tabla from '../common/Tabla.jsx';
import Modal from '../common/Modal.jsx';
import ModalConfirmacion from '../common/ModalConfirmacion.jsx';
import { eliminarSala } from '../servicios/servicioSalas.js';

const OPCIONES_ESTADO = [
  { valor: 'activas', texto: 'Activas' },
  { valor: 'eliminadas', texto: 'Eliminadas' },
  { valor: 'todas', texto: 'Todas' },
];

const FILTROS_INICIALES = { idSede: '', idTipo: '', idFormato: '', estado: 'activas' };

const claseBarraBusqueda = 'mb-4 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-black placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft';

function Salas() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const { salas, cargando, error, recargar } = useSalas({
    busqueda: busquedaRetrasada,
    idSede: filtros.idSede,
    idTipo: filtros.idTipo,
    idFormato: filtros.idFormato,
    estado: filtros.estado,
  });
  const { sedes } = useSedes({ estado: 'activas' });
  const { tipos, formatos, error: errorCatalogo } = useCatalogoSala();

  const opcionesDe = (lista) =>
    lista.map((fila) => ({
      valor: String(fila[POS_CATALOGO_SALA.id]),
      texto: fila[POS_CATALOGO_SALA.nombre],
    }));

  const columnas = [
    {
      titulo: 'Cine',
      posicion: POS_SALA.cine,
      filtro: {
        clave: 'idSede',
        tipo: 'seleccion',
        opciones: sedes.map((sede) => ({
          valor: String(sede[POS_SEDE.id]),
          texto: sede[POS_SEDE.nombre],
        })),
      },
    },
    { titulo: 'Nombre', posicion: POS_SALA.nombre },
    {
      titulo: 'Tipo',
      posicion: POS_SALA.tipo,
      filtro: { clave: 'idTipo', tipo: 'seleccion', opciones: opcionesDe(tipos) },
    },
    {
      titulo: 'Formato',
      posicion: POS_SALA.formato,
      filtro: { clave: 'idFormato', tipo: 'seleccion', opciones: opcionesDe(formatos) },
    },
    {
      titulo: 'Estado',
      posicion: POS_SALA.estado,
      formato: (valor) => (valor === ESTADO_SALA.activa ? 'Activa' : 'Eliminada'),
      filtro: { clave: 'estado', tipo: 'seleccion', opciones: OPCIONES_ESTADO, opcionVacia: null },
    },
  ];

  const hayFiltros =
    busquedaRetrasada.trim() !== '' ||
    filtros.idSede !== '' ||
    filtros.idTipo !== '' ||
    filtros.idFormato !== '' ||
    filtros.estado !== FILTROS_INICIALES.estado;
  const textoVacio = hayFiltros
    ? 'No se encontraron salas con esos criterios'
    : 'No hay salas para mostrar en este momento';

  function verSala() {}

  function editarSala() {}

  const [salaAEliminar, setSalaAEliminar] = useState(null);
  const [resultado, setResultado] = useState(null);

  async function confirmarEliminacion() {
    const sala = salaAEliminar;
    setSalaAEliminar(null);

    try {
      await eliminarSala(sala[POS_SALA.id]);
      setResultado({ mensaje: 'Sala eliminada con éxito', textoBoton: 'Continuar' });
    } catch (error) {
      setResultado({ mensaje: error.message, textoBoton: 'Cerrar' });
    }
  }

  function cerrarResultado() {
    setResultado(null);
    recargar();
  }

  const salaEliminada = (sala) => sala[POS_SALA.estado] !== ESTADO_SALA.activa;

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5">
          <h1 className="text-4xl font-bold">Salas</h1>
        </div>

        <input
          type="search"
          className={claseBarraBusqueda}
          placeholder="Buscar salas"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="mb-4 text-text-muted">Cargando salas...</p>}
        {error && <p className="mb-4 text-warning">{error}</p>}
        {errorCatalogo && <p className="mb-4 text-warning">{errorCatalogo}</p>}

        <Tabla
          columnas={columnas}
          filas={salas}
          posicionId={POS_SALA.id}
          filtros={filtros}
          alCambiarFiltros={setFiltros}
          textoVacio={cargando ? '' : textoVacio}
          onVer={verSala}
          onEditar={editarSala}
          onEliminar={setSalaAEliminar}
          accionesDeshabilitadas={salaEliminada}
        />
      </div>

      {salaAEliminar && (
        <ModalConfirmacion
          peligrosa
          titulo="Eliminar sala"
          mensaje={`¿Está seguro de que desea eliminar la sala "${salaAEliminar[POS_SALA.nombre]}" de ${salaAEliminar[POS_SALA.cine]}? Esta acción es permanente.`}
          textoConfirmar="Eliminar"
          alConfirmar={confirmarEliminacion}
          alCancelar={() => setSalaAEliminar(null)}
        />
      )}

      {resultado && (
        <Modal
          mensaje={resultado.mensaje}
          botones={[{ texto: resultado.textoBoton, alPulsar: cerrarResultado }]}
        />
      )}
    </main>
  );
}

export default Salas;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSedes } from '../ganchos/useSedes.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import Tabla from '../common/Tabla.jsx';
import Modal from '../common/Modal.jsx';
import ModalConfirmacion from '../common/ModalConfirmacion.jsx';
import { eliminarSede } from '../servicios/servicioSedes.js';

const columnas = [
  { titulo: 'Sede', posicion: POS_SEDE.nombre },
  { titulo: 'Cantón', posicion: POS_SEDE.canton },
  { titulo: 'Provincia', posicion: POS_SEDE.provincia },
];

const claseBarraBusqueda = 'mb-12 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-black placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft';
const claseBoton = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover';


function Sedes() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const { sedes, cargando, error, recargar } = useSedes(busquedaRetrasada);

  const [sedeAEliminar, setSedeAEliminar] = useState(null);
  const [resultado, setResultado] = useState(null);

  function editarSede(sede) {
    console.log('Editar sede', sede[POS_SEDE.id]);
  }

  async function confirmarEliminacion() {
    const sede = sedeAEliminar;
    setSedeAEliminar(null);

    try {
      await eliminarSede(sede[POS_SEDE.id]);
      setResultado({ mensaje: 'Sede eliminada con éxito', textoBoton: 'Continuar' });
    } catch (error) {
      setResultado({ mensaje: error.message, textoBoton: 'Cerrar' });
    }
  }

  function cerrarResultado() {
    setResultado(null);
    recargar();
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-27">
          <h1 className="text-4xl font-bold">Sedes</h1>

          <Link
            to="/sedes/nueva"
            className={claseBoton}
          >
            Crear sede
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <input
          type="search"
          className={claseBarraBusqueda}
          placeholder="Buscar sedes"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="text-text-muted">Cargando sedes...</p>}
        {error && <p className="text-warning">{error}</p>}
        {!cargando && !error && (
          <Tabla
            columnas={columnas}
            filas={sedes}
            posicionId={POS_SEDE.id}
            textoVacio="No se encontraron sedes"
            onEditar={editarSede}
            onEliminar={setSedeAEliminar}
          />
        )}
      </div>

      {sedeAEliminar && (
        <ModalConfirmacion
          peligrosa
          titulo="Eliminar sede"
          mensaje={`¿Está seguro de que desea eliminar la sede "${sedeAEliminar[POS_SEDE.nombre]}"? Esta acción es permanente.`}
          textoConfirmar="Eliminar"
          alConfirmar={confirmarEliminacion}
          alCancelar={() => setSedeAEliminar(null)}
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

export default Sedes;

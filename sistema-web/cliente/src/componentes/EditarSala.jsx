import { useState } from 'react';
import { editarSala } from '../servicios/servicioSalas.js';
import { useSala } from '../ganchos/useSala.js';
import { POS_SALA, POS_DETALLE_SALA as POS } from '../constantes/posicionesSala.js';
import FormularioSala from './FormularioSala.jsx';
import ErrorCarga from './ErrorCarga.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

// Edición de una sala en un modal: solo se pueden cambiar (y por eso solo se muestran) el nombre, el tipo y el formato
function EditarSala({ sala: salaDeLista, alCancelar, alEditar }) {
  const idSala = salaDeLista[POS_SALA.id];
  // Se piden los datos completos de la sala (la lista no trae la distribución)
  const { sala, cargando, error: errorCarga, recargar } = useSala(idSala);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar({ nombre, idTipo, idFormato }) {
    setGuardando(true);
    setError(null);

    try {
      await editarSala(idSala, { nombre, idTipo, idFormato });
      alEditar();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalFormulario titulo="Editar sala" alCerrar={alCancelar}>
      {cargando && <p className="text-text-muted">Cargando sala...</p>}
      <ErrorCarga error={errorCarga} alReintentar={recargar} className="mb-6" />

      {/* El fondo del modal es del mismo color que el texto atenuado de los datos de solo lectura: aquí se aclaran */}
      {sala && (
        <div className="[&_output]:border-text-color/50 [&_output]:text-text-color">
          <FormularioSala
            edicion
            valorInicial={{
              nombre: sala[POS.nombre],
              idSede: sala[POS.idCine],
              idTipo: sala[POS.idTipo],
              idFormato: sala[POS.idFormato],
              idDistribucion: sala[POS.idDistribucion],
            }}
            textoGuardar="Guardar cambios"
            alEnviar={guardar}
            alCancelar={alCancelar}
            guardando={guardando}
            error={error}
          />
        </div>
      )}

      {/* Si la sala no carga, el modal igual se puede cerrar */}
      {!sala && !cargando && (
        <button type="button" onClick={alCancelar} className="mt-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover">
          Cerrar
        </button>
      )}
    </ModalFormulario>
  );
}

export default EditarSala;

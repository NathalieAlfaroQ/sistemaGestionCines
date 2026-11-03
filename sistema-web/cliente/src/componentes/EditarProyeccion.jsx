import { useState } from 'react';
import { editarProyeccion } from '../servicios/servicioProyecciones.js';
import { POS_PROYECCION } from '../constantes/posicionesProyeccion.js';
import { textoAFecha } from '../validaciones/validacionesProyeccion.js';
import { useTareasDeProyeccion } from '../ganchos/useTareas.js';
import FormularioProyeccion from './FormularioProyeccion.jsx';
import ErrorCarga from './ErrorCarga.jsx';
import { claseBotonSecundario } from '../constantes/clasesFormulario.js';
import ModalFormulario from '../common/ModalFormulario.jsx';

function EditarProyeccion({ proyeccion, alCancelar, alEditar }) {
  const { tareasDeProyeccion, cargando, error: errorCarga, recargar } = useTareasDeProyeccion(proyeccion[POS_PROYECCION.id]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(datos) {
    setGuardando(true);
    setError(null);

    try {
      await editarProyeccion(proyeccion[POS_PROYECCION.id], datos);
      alEditar();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  const [hora, minuto] = proyeccion[POS_PROYECCION.hora].split(':');

  return (
    <ModalFormulario titulo="Editar proyección" alCerrar={alCancelar}>
      {cargando && <p className="text-text-muted">Cargando proyección...</p>}
      <ErrorCarga error={errorCarga} alReintentar={recargar} className="mb-6" />

      {tareasDeProyeccion && (
        <FormularioProyeccion
          valorInicial={{
            idPelicula: String(proyeccion[POS_PROYECCION.idPelicula]),
            idSede: String(proyeccion[POS_PROYECCION.idCine]),
            idSala: String(proyeccion[POS_PROYECCION.idSala]),
            fecha: textoAFecha(proyeccion[POS_PROYECCION.fecha]),
            hora,
            minuto,
            tareas: tareasDeProyeccion.map(([idTarea, minutos]) => ({ idTarea: String(idTarea), minutos: String(minutos) })),
          }}
          textoGuardar="Guardar cambios"
          alEnviar={guardar}
          alCancelar={alCancelar}
          guardando={guardando}
          error={error}
        />
      )}

      {/* */}
      {!tareasDeProyeccion && !cargando && (
        <button type="button" onClick={alCancelar} className={claseBotonSecundario}>
          Cerrar
        </button>
      )}
    </ModalFormulario>
  );
}

export default EditarProyeccion;

import { useState } from 'react';
import { editarProyeccion } from '../servicios/servicioProyecciones.js';
import { POS_PROYECCION } from '../constantes/posicionesProyeccion.js';
import { textoAFecha } from '../validaciones/validacionesProyeccion.js';
import FormularioProyeccion from './FormularioProyeccion.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

function EditarProyeccion({ proyeccion, alCancelar, alEditar }) {
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
      <FormularioProyeccion
        valorInicial={{
          idPelicula: String(proyeccion[POS_PROYECCION.idPelicula]),
          idSede: String(proyeccion[POS_PROYECCION.idCine]),
          idSala: String(proyeccion[POS_PROYECCION.idSala]),
          fecha: textoAFecha(proyeccion[POS_PROYECCION.fecha]),
          hora,
          minuto,
        }}
        textoGuardar="Guardar cambios"
        alEnviar={guardar}
        alCancelar={alCancelar}
        guardando={guardando}
        error={error}
      />
    </ModalFormulario>
  );
}

export default EditarProyeccion;

import { useState } from 'react';
import { editarSede } from '../servicios/servicioSedes.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import FormularioSede from './FormularioSede.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

function EditarSede({ sede, alCancelar, alEditar }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(datos) {
    setGuardando(true);
    setError(null);

    try {
      await editarSede(sede[POS_SEDE.id], datos);
      alEditar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalFormulario titulo="Editar sede" alCerrar={alCancelar}>
      <FormularioSede
        valorInicial={{
          nombre: sede[POS_SEDE.nombre],
          idProvincia: sede[POS_SEDE.idProvincia],
          idCanton: sede[POS_SEDE.idCanton],
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

export default EditarSede;

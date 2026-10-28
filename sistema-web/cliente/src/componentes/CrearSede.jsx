import { useState } from 'react';
import { crearSede } from '../servicios/servicioSedes.js';
import FormularioSede from './FormularioSede.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

function CrearSede({ alCancelar, alCrear }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(sede) {
    setGuardando(true);
    setError(null);

    try {
      await crearSede(sede);
      alCrear();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalFormulario titulo="Crear sede" alCerrar={alCancelar}>
      <FormularioSede
        alEnviar={guardar}
        alCancelar={alCancelar}
        guardando={guardando}
        error={error}
      />
    </ModalFormulario>
  );
}

export default CrearSede;

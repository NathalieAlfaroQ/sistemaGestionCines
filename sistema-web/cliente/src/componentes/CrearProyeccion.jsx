import { useState } from 'react';
import { crearProyeccion } from '../servicios/servicioProyecciones.js';
import FormularioProyeccion from './FormularioProyeccion.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

function CrearProyeccion({ alCancelar, alCrear }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(proyeccion) {
    setGuardando(true);
    setError(null);

    try {
      await crearProyeccion(proyeccion);
      alCrear();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalFormulario titulo="Crear proyección" alCerrar={alCancelar}>
      <FormularioProyeccion
        alEnviar={guardar}
        alCancelar={alCancelar}
        guardando={guardando}
        error={error}
      />
    </ModalFormulario>
  );
}

export default CrearProyeccion;

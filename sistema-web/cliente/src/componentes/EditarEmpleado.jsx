import { useState } from 'react';
import { editarEmpleado } from '../servicios/servicioEmpleados.js';
import FormularioEmpleado from './FormularioUsuario.jsx';
import Modal from '../common/Modal.jsx'; 

function EditarEmpleado({ empleado, alCancelar, alEditar }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(datos) {
    setGuardando(true);
    setError(null);

    try {
      await editarEmpleado(empleado.idEmpleado, datos);
      alEditar();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Editar Empleado" alCerrar={alCancelar}>
      <FormularioEmpleado
        valorInicial={{
          nombre: empleado.nombreCompleto.split(' ')[0],
          apellido: empleado.nombreCompleto.split(' ').slice(1).join(' '),
          correo: empleado.correo,
          tipoUsuario: empleado.tipoUsuario,
        }}
        textoGuardar="Guardar cambios"
        alEnviar={guardar}
        alCancelar={alCancelar}
        guardando={guardando}
        error={error}
      />
    </Modal>
  );
}

export default EditarEmpleado;
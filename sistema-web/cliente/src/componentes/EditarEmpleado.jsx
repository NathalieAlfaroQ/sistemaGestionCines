import { useState } from 'react';
import { editarEmpleado } from '../servicios/servicioEmpleados.js';
import FormularioEmpleado from './FormularioUsuario.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx'; 
import { useSedes } from '../ganchos/useSedes.js';

function EditarEmpleado({ empleado, alCancelar, alEditar }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const { sedes = [] } = useSedes() || {};
  const nombreCompleto = empleado?.nombreCompleto || '';
  const partesNombre = nombreCompleto.trim().split(' ');
  const nombre = partesNombre[0] || '';
  const apellido = partesNombre.slice(1).join(' ') || '';

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
    <ModalFormulario titulo="Editar Empleado" alCerrar={alCancelar}>
      <FormularioEmpleado
        sedes={sedes}
        valorInicial={{
          nombre: nombre,
          apellido: apellido,
          correo: empleado?.correo || '',
          tipoUsuario: 'EMPLEADO',
          idSede: empleado?.idSede ? String(empleado.idSede) : '',
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

export default EditarEmpleado;
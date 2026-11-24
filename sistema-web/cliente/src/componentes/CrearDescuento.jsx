import { useState } from 'react';
import { crearDescuento } from '../servicios/servicioDescuentos.js';
import FormularioDescuento from './FormularioDescuento.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

function CrearDescuento({ alCancelar, alCrear }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(descuento) {
    setGuardando(true);
    setError(null);

    try {
      await crearDescuento(descuento);
      alCrear();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalFormulario titulo="Crear descuento" alCerrar={alCancelar} ancho="max-w-2xl">
      <FormularioDescuento alEnviar={guardar} alCancelar={alCancelar} guardando={guardando} error={error} />
    </ModalFormulario>
  );
}

export default CrearDescuento;

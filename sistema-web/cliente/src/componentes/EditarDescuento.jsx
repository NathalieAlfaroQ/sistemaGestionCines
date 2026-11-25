import { useState } from 'react';
import { editarDescuento } from '../servicios/servicioDescuentos.js';
import { POS_DESCUENTO } from '../constantes/posicionesDescuento.js';
import { textoAFecha } from '../validaciones/validacionesProyeccion.js';
import FormularioDescuento from './FormularioDescuento.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

function EditarDescuento({ descuento, alCancelar, alEditar }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar(datos) {
    setGuardando(true);
    setError(null);

    try {
      await editarDescuento(descuento[POS_DESCUENTO.id], datos);
      alEditar();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  const [horaInicio, minutoInicio] = descuento[POS_DESCUENTO.horaInicio].split(':');
  const [horaFin, minutoFin] = descuento[POS_DESCUENTO.horaFin].split(':');
  const idsPeliculas = descuento[POS_DESCUENTO.idsPeliculas];

  return (
    <ModalFormulario titulo="Editar descuento" alCerrar={alCancelar} ancho="max-w-2xl">
      <FormularioDescuento
        valorInicial={{
          nombre: descuento[POS_DESCUENTO.nombre],
          porcentaje: String(descuento[POS_DESCUENTO.porcentaje]),
          idSede: String(descuento[POS_DESCUENTO.idCine]),
          aplicaTodas: descuento[POS_DESCUENTO.aplicaTodas] === 1,
          idsPeliculas: idsPeliculas ? idsPeliculas.split(',').map(Number) : [],
          fechaInicio: textoAFecha(descuento[POS_DESCUENTO.fechaInicio]),
          horaInicio,
          minutoInicio,
          fechaFin: textoAFecha(descuento[POS_DESCUENTO.fechaFin]),
          horaFin,
          minutoFin,
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

export default EditarDescuento;

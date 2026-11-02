import { POS_PROYECCION } from '../constantes/posicionesProyeccion.js';
import { formatearFecha } from '../utilidades/formatearFecha.js';
import { formatearHora } from '../utilidades/fechas.js';
import CampoSoloLectura from './CampoSoloLectura.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

const claseBotonCerrar = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover';

function VerProyeccion({ proyeccion, alCerrar }) {
  return (
    <ModalFormulario titulo="Ver proyección" alCerrar={alCerrar}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        <div className="col-span-2">
          <CampoSoloLectura id="pelicula" etiqueta="Película" valor={proyeccion[POS_PROYECCION.pelicula]} />
        </div>

        <CampoSoloLectura id="sede" etiqueta="Cine" valor={proyeccion[POS_PROYECCION.cine]} />
        <CampoSoloLectura id="sala" etiqueta="Sala" valor={proyeccion[POS_PROYECCION.sala]} />

        <CampoSoloLectura id="fecha" etiqueta="Fecha" valor={formatearFecha(proyeccion[POS_PROYECCION.fecha])} />
        <CampoSoloLectura id="hora" etiqueta="Hora" valor={formatearHora(proyeccion[POS_PROYECCION.hora])} />

        <div className="col-span-2">
          <button type="button" onClick={alCerrar} className={claseBotonCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </ModalFormulario>
  );
}

export default VerProyeccion;

import { POS_CATALOGO } from '../constantes/posicionesCatalogo.js';
import { claseCampo } from '../constantes/clasesFormulario.js';
import { MINUTOS_TAREA_MAXIMO } from '../validaciones/validacionesProyeccion.js';
import MensajeError from '../common/MensajeError.jsx';
import SeleccionMultiple from './SeleccionMultiple.jsx';

function SeccionTareas({ tareas, catalogo, error, alElegir, alCambiarMinutos, alTocar }) {
  const ids = tareas.map((tarea) => Number(tarea.idTarea));
  const elegidas = catalogo.filter((fila) => ids.includes(fila[POS_CATALOGO.id]));
  const minutosDe = (id) => tareas.find((tarea) => tarea.idTarea === String(id)).minutos;

  return (
    <div className="flex flex-col gap-3">
      <SeleccionMultiple
        etiqueta="Tareas adicionales"
        textoVacio="Seleccione las tareas adicionales (opcional)"
        obligatorio={false}
        opciones={catalogo}
        seleccionados={ids}
        alCambiar={alElegir}
      />

      {elegidas.map((fila) => {
        const id = fila[POS_CATALOGO.id];
        return (
          <div key={id} className="flex items-center gap-3">
            <label htmlFor={`minutos-tarea-${id}`} className="min-w-0 flex-1 truncate text-sm text-text-color">
              {fila[POS_CATALOGO.nombre]}
            </label>
            <div className="w-32 shrink-0">
              <input
                id={`minutos-tarea-${id}`}
                type="number"
                className={claseCampo}
                placeholder="Minutos"
                min={1}
                max={MINUTOS_TAREA_MAXIMO}
                step={1}
                value={minutosDe(id)}
                onChange={(evento) => alCambiarMinutos(String(id), evento.target.value)}
                onBlur={alTocar}
              />
            </div>
          </div>
        );
      })}

      <MensajeError id="error-tareas" mensaje={error} className="mt-0" />
    </div>
  );
}

export default SeccionTareas;

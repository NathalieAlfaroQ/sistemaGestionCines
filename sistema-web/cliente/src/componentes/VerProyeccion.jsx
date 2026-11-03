import { POS_PROYECCION } from '../constantes/posicionesProyeccion.js';
import { POS_PELICULA } from '../constantes/posicionesPelicula.js';
import { POS_CATALOGO } from '../constantes/posicionesCatalogo.js';
import { claseSoloLecturaEnModal } from '../constantes/clasesFormulario.js';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import { useTareas, useTareasDeProyeccion } from '../ganchos/useTareas.js';
import { formatearFecha } from '../utilidades/formatearFecha.js';
import { formatearHora } from '../utilidades/fechas.js';
import { formatearDuracion } from '../utilidades/formatearDuracion.js';
import { minutosDeTareas } from '../validaciones/validacionesProyeccion.js';
import CampoSoloLectura from './CampoSoloLectura.jsx';
import ModalFormulario from '../common/ModalFormulario.jsx';

const claseBotonCerrar = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover';

function VerProyeccion({ proyeccion, alCerrar }) {
  const { peliculas } = usePeliculas();
  const { tareas: catalogo } = useTareas();
  const { tareasDeProyeccion } = useTareasDeProyeccion(proyeccion[POS_PROYECCION.id]);

  // Tareas de la proyección con su nombre: "Limpieza (15 min)"
  const tareas = tareasDeProyeccion?.map(([idTarea, minutos]) => {
    const fila = catalogo.find((tarea) => tarea[POS_CATALOGO.id] === idTarea);
    return { minutos, texto: `${fila ? fila[POS_CATALOGO.nombre] : 'Tarea'} (${minutos} min)` };
  });
  const textoTareas = tareas && (tareas.length === 0 ? 'Ninguna' : tareas.map((tarea) => tarea.texto).join(', '));

  // La sala queda ocupada por la película más el tiempo de las tareas adicionales
  const pelicula = peliculas.find((fila) => String(fila[POS_PELICULA.id]) === String(proyeccion[POS_PROYECCION.idPelicula]));
  const duracionTotal = pelicula && tareas ? pelicula[POS_PELICULA.duracion] + minutosDeTareas(tareas) : null;

  return (
    <ModalFormulario titulo="Ver proyección" alCerrar={alCerrar}>
      <div className={`grid grid-cols-2 gap-x-4 gap-y-6 ${claseSoloLecturaEnModal}`}>
        <div className="col-span-2">
          <CampoSoloLectura id="pelicula" etiqueta="Película" valor={proyeccion[POS_PROYECCION.pelicula]} />
        </div>

        <CampoSoloLectura id="sede" etiqueta="Cine" valor={proyeccion[POS_PROYECCION.cine]} />
        <CampoSoloLectura id="sala" etiqueta="Sala" valor={proyeccion[POS_PROYECCION.sala]} />

        <CampoSoloLectura id="fecha" etiqueta="Fecha" valor={formatearFecha(proyeccion[POS_PROYECCION.fecha])} />
        <CampoSoloLectura id="hora" etiqueta="Hora" valor={formatearHora(proyeccion[POS_PROYECCION.hora])} />

        <div className="col-span-2">
          <CampoSoloLectura id="tareas" etiqueta="Tareas adicionales" valor={textoTareas} />
        </div>

        <div className="col-span-2">
          <CampoSoloLectura
            id="duracion"
            etiqueta="Duración total (película y tareas)"
            valor={duracionTotal === null ? null : formatearDuracion(duracionTotal)}
          />
        </div>

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

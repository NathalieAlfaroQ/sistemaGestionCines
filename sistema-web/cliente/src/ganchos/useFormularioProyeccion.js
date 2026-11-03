import { useFormulario } from './useFormulario.js';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesProyeccion.js';

export const FORMULARIO_INICIAL = { idPelicula: '', idSede: '', idSala: '', fecha: null, hora: '', minuto: '', tareas: [] };

const estaIncompleto = (formulario) =>
  formulario.idPelicula === '' ||
  formulario.idSede === '' ||
  formulario.idSala === '' ||
  formulario.fecha === null ||
  formulario.hora === '' ||
  formulario.minuto === '' ||
  formulario.tareas.some((tarea) => tarea.idTarea === '' || tarea.minutos === '');

export function useFormularioProyeccion(valoresIniciales = FORMULARIO_INICIAL) {
  const formulario = useFormulario(valoresIniciales, { validarTodo, validarEnVivo, estaIncompleto });
  const { tareas } = formulario.formulario;

  function cambiarSede(idSede) {
    formulario.cambiarYLimpiar('idSede', idSede, 'idSala');
  }

  const cambiarTareas = (nuevasTareas) => formulario.actualizar('tareas', nuevasTareas);

  const elegirTareas = (ids) =>
    cambiarTareas(ids.map((id) => tareas.find((tarea) => tarea.idTarea === String(id)) ?? { idTarea: String(id), minutos: '' }));
  const cambiarMinutos = (idTarea, minutos) =>
    cambiarTareas(tareas.map((tarea) => (tarea.idTarea === idTarea ? { ...tarea, minutos } : tarea)));

  return { ...formulario, cambiarSede, elegirTareas, cambiarMinutos };
}

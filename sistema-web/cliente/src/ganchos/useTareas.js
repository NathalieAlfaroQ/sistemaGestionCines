import { obtenerTareas, obtenerTareasDeProyeccion } from '../servicios/servicioProyecciones.js';
import { useConsulta } from './useConsulta.js';

export function useTareas() {
  const { datos, cargando, error, recargar } = useConsulta(obtenerTareas, [], []);
  return { tareas: datos, cargando, error, recargar };
}

export function useTareasDeProyeccion(idProyeccion) {
  const { datos, cargando, error, recargar } = useConsulta(
    () => obtenerTareasDeProyeccion(idProyeccion),
    [idProyeccion],
    null,
  );
  return { tareasDeProyeccion: datos, cargando, error, recargar };
}

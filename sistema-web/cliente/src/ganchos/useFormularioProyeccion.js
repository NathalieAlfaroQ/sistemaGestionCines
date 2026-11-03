import { useFormulario } from './useFormulario.js';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesProyeccion.js';

export const FORMULARIO_INICIAL = { idPelicula: '', idSede: '', idSala: '', fecha: null, hora: '', minuto: '' };

const estaIncompleto = (formulario) =>
  formulario.idPelicula === '' ||
  formulario.idSede === '' ||
  formulario.idSala === '' ||
  formulario.fecha === null ||
  formulario.hora === '' ||
  formulario.minuto === '';

export function useFormularioProyeccion(valoresIniciales = FORMULARIO_INICIAL) {
  const formulario = useFormulario(valoresIniciales, { validarTodo, validarEnVivo, estaIncompleto });

  function cambiarSede(idSede) {
    formulario.cambiarYLimpiar('idSede', idSede, 'idSala');
  }

  return { ...formulario, cambiarSede };
}

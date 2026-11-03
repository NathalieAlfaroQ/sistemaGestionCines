import { useFormulario } from './useFormulario.js';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesSala.js';

export const FORMULARIO_INICIAL = { nombre: '', idSede: '', idTipo: '', idFormato: '', idDistribucion: '' };

const estaIncompleto = (formulario) =>
  formulario.nombre.trim() === '' ||
  formulario.idSede === '' ||
  formulario.idTipo === '' ||
  formulario.idFormato === '' ||
  formulario.idDistribucion === '';

export function useFormularioSala(valoresIniciales = FORMULARIO_INICIAL) {
  return useFormulario(valoresIniciales, { validarTodo, validarEnVivo, estaIncompleto });
}

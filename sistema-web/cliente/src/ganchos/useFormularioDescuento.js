import { useFormulario } from './useFormulario.js';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesDescuento.js';

export const FORMULARIO_INICIAL = {
  nombre: '',
  porcentaje: '',
  idSede: '',
  aplicaTodas: false,
  idsPeliculas: [],
  fechaInicio: null,
  horaInicio: '',
  minutoInicio: '',
  fechaFin: null,
  horaFin: '',
  minutoFin: '',
};

const estaIncompleto = (formulario) =>
  formulario.nombre.trim() === '' ||
  formulario.porcentaje.trim() === '' ||
  formulario.idSede === '' ||
  (!formulario.aplicaTodas && formulario.idsPeliculas.length === 0) ||
  formulario.fechaInicio === null ||
  formulario.horaInicio === '' ||
  formulario.minutoInicio === '' ||
  formulario.fechaFin === null ||
  formulario.horaFin === '' ||
  formulario.minutoFin === '';

export function useFormularioDescuento(valoresIniciales = FORMULARIO_INICIAL) {
  return useFormulario(valoresIniciales, { validarTodo, validarEnVivo, estaIncompleto });
}
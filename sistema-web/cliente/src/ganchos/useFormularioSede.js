import { useFormulario } from './useFormulario.js';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesSede.js';

export const FORMULARIO_INICIAL = { nombre: '', idProvincia: '', idCanton: '' };

const estaIncompleto = (formulario) =>
  formulario.nombre.trim() === '' || formulario.idProvincia === '' || formulario.idCanton === '';

export function useFormularioSede(valoresIniciales = FORMULARIO_INICIAL) {
  const formulario = useFormulario(valoresIniciales, { validarTodo, validarEnVivo, estaIncompleto });

  function cambiarProvincia(idProvincia) {
    formulario.cambiarYLimpiar('idProvincia', idProvincia, 'idCanton');
  }

  return { ...formulario, cambiarProvincia };
}

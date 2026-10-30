import { useState } from 'react';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesProyeccion.js';

export const FORMULARIO_INICIAL = { idPelicula: '', idSede: '', idSala: '', fecha: null, hora: '', minuto: '' };

export function useFormularioProyeccion(valoresIniciales = FORMULARIO_INICIAL) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [tocados, setTocados] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const errores = validarTodo({ formulario });
  const erroresEnVivo = validarEnVivo({ formulario });

  const hayCamposVacios =
    formulario.idPelicula === '' ||
    formulario.idSede === '' ||
    formulario.idSala === '' ||
    formulario.fecha === null ||
    formulario.hora === '' ||
    formulario.minuto === '';

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  function cambiarSede(idSede) {
    setFormulario((anterior) => ({ ...anterior, idSede, idSala: '' }));
    setTocados((anteriores) => ({ ...anteriores, idSala: false }));
  }

  function errorVisible(campo) {
    if (intentoEnvio || tocados[campo]) return errores[campo] ?? null;
    return erroresEnVivo[campo] ?? null;
  }

  function enlazar(campo) {
    return {
      value: formulario[campo],
      onChange: (evento) => actualizar(campo, evento.target.value),
      onBlur: () => marcarTocado(campo),
    };
  }

  function validarAlEnviar() {
    setIntentoEnvio(true);
    return Object.keys(errores).length === 0;
  }

  return {
    formulario,
    hayCamposVacios,
    errorVisible,
    actualizar,
    enlazar,
    cambiarSede,
    marcarTocado,
    validarAlEnviar,
  };
}

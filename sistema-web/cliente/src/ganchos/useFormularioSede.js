import { useState } from 'react';
import { validarEnVivo, validarTodo } from '../validaciones/validacionesSede.js';

export const FORMULARIO_INICIAL = { nombre: '', idProvincia: '', idCanton: '' };

export function useFormularioSede(valoresIniciales = FORMULARIO_INICIAL) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [tocados, setTocados] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const errores = validarTodo({ formulario });
  const erroresEnVivo = validarEnVivo({ formulario });

  const hayCamposVacios =
    formulario.nombre.trim() === '' || formulario.idProvincia === '' || formulario.idCanton === '';

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  function cambiarProvincia(idProvincia) {
    setFormulario((anterior) => ({ ...anterior, idProvincia, idCanton: '' }));
    setTocados((anteriores) => ({ ...anteriores, idCanton: false }));
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
    enlazar,
    cambiarProvincia,
    marcarTocado,
    validarAlEnviar,
  };
}

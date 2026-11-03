import { useState } from 'react';

// Lógica común de los formularios con validación:
export function useFormulario(valoresIniciales, { validarTodo, validarEnVivo, estaIncompleto }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [tocados, setTocados] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const errores = validarTodo({ formulario });
  const erroresEnVivo = validarEnVivo({ formulario });
  const hayCamposVacios = estaIncompleto(formulario);

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  function cambiarYLimpiar(campo, valor, campoDependiente) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor, [campoDependiente]: '' }));
    setTocados((anteriores) => ({ ...anteriores, [campoDependiente]: false }));
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

  return { formulario, hayCamposVacios, errorVisible, actualizar, enlazar, marcarTocado, cambiarYLimpiar, validarAlEnviar };
}

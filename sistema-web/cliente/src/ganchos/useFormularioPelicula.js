import { useState } from 'react';
import { validarTodo } from '../validaciones/validacionesPelicula.js';

export const FORMULARIO_INICIAL = {
  titulo: '',
  sinopsis: '',
  duracion: '',
  clasificacion: '',
  generos: [],
  idiomas: [],
};
const IMAGENES_INICIALES = { poster: null, banner: null };

export function useFormularioPelicula(valoresIniciales = FORMULARIO_INICIAL, urlsExistentes = {}) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [imagenes, setImagenes] = useState(IMAGENES_INICIALES);
  const [erroresImagen, setErroresImagen] = useState({});
  const [tocados, setTocados] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const errores = validarTodo({ formulario, imagenes, existentes: urlsExistentes });

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  // El error de un campo solo se ve si ya se tocó el campo o si se intentó enviar
  function errorVisible(campo) {
    return intentoEnvio || tocados[campo] ? (errores[campo] ?? null) : null;
  }

  // Devuelve las propiedades comunes de un campo de texto, para no repetirlas en cada uno
  function enlazar(campo) {
    return {
      value: formulario[campo],
      onChange: (evento) => actualizar(campo, evento.target.value),
      onBlur: () => marcarTocado(campo),
      color: errorVisible(campo) ? 'failure' : 'gray',
    };
  }

  function actualizarImagen(tipo, archivo) {
    setImagenes((anteriores) => ({ ...anteriores, [tipo]: archivo }));
    setErroresImagen((anteriores) => ({ ...anteriores, [tipo]: null }));
    marcarTocado(tipo);
  }

  // Marca que se intentó enviar (para mostrar todos los errores) y dice si se puede continuar
  function validarAlEnviar() {
    setIntentoEnvio(true);
    return Object.keys(errores).length === 0;
  }

  function limpiar() {
    setFormulario(valoresIniciales);
    setImagenes(IMAGENES_INICIALES);
    setErroresImagen({});
    setTocados({});
    setIntentoEnvio(false);
  }

  return {
    formulario,
    imagenes,
    erroresImagen,
    establecerErroresImagen: setErroresImagen,
    errorVisible,
    enlazar,
    actualizar,
    marcarTocado,
    actualizarImagen,
    validarAlEnviar,
    limpiar,
  };
}
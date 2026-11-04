import { useState } from 'react';
import {
  formatearNumeroTarjeta,
  formatearVencimiento,
  soloDigitos,
  validarTarjeta,
} from '../validaciones/validacionesTarjeta.js';

const FORMULARIO_INICIAL = { titular: '', numero: '', vencimiento: '', cvv: '' };

// Algunos campos se van formateando mientras se escribe
const formateadores = {
  numero: formatearNumeroTarjeta,
  vencimiento: formatearVencimiento,
  cvv: (texto) => soloDigitos(texto).slice(0, 4),
};

// Mismo patrón que useFormularioPelicula: los errores se ven al salir del campo o al intentar pagar
export function useFormularioTarjeta() {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardarTarjeta, setGuardarTarjeta] = useState(false);
  const [tocados, setTocados] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const errores = validarTarjeta(formulario);

  function actualizar(campo, valor) {
    const formatear = formateadores[campo];
    setFormulario((anterior) => ({ ...anterior, [campo]: formatear ? formatear(valor) : valor }));
  }

  function marcarTocado(campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  function errorVisible(campo) {
    return intentoEnvio || tocados[campo] ? (errores[campo] ?? null) : null;
  }

  function enlazar(campo) {
    return {
      value: formulario[campo],
      onChange: (evento) => actualizar(campo, evento.target.value),
      onBlur: () => marcarTocado(campo),
      color: errorVisible(campo) ? 'failure' : 'gray',
    };
  }

  // Marca que se intentó pagar (para mostrar todos los errores) y dice si se puede continuar
  function validarAlEnviar() {
    setIntentoEnvio(true);
    return Object.keys(errores).length === 0;
  }

  return { formulario, guardarTarjeta, setGuardarTarjeta, errorVisible, enlazar, validarAlEnviar };
}

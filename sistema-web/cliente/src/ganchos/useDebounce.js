import { useEffect, useState } from 'react';

export function useDebounce(valor, retardo = 400) {
  const [valorRetrasado, setValorRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorRetrasado(valor), retardo);

    return () => clearTimeout(temporizador);
  }, [valor, retardo]);

  return valorRetrasado;
}
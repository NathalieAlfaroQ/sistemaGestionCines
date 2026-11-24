import { useEffect, useState } from 'react';

// Cuenta regresiva en segundos a partir de los que indica el servidor.
// Se calcula contra una hora límite (y no restando 1 cada segundo) para que no se atrase
// si la pestaña queda en segundo plano y el navegador frena los temporizadores.
// Con segundosIniciales null no cuenta y devuelve null.
export function useCuentaRegresiva(segundosIniciales) {
  const [restantes, setRestantes] = useState(segundosIniciales ?? null);

  useEffect(() => {
    if (segundosIniciales === null || segundosIniciales === undefined) {
      setRestantes(null);
      return undefined;
    }

    const limite = Date.now() + segundosIniciales * 1000;
    function actualizar() {
      setRestantes(Math.max(0, Math.ceil((limite - Date.now()) / 1000)));
    }

    actualizar();
    const temporizador = setInterval(actualizar, 1000);
    return () => clearInterval(temporizador);
  }, [segundosIniciales]);

  return restantes;
}

// 287 → '4:47'
export function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast, ToastToggle } from 'flowbite-react';
import { ContextoNotificaciones } from '../ganchos/useNotificaciones.js';
import { temasToast } from '../temas/temaToast.js';

const MAXIMO_VISIBLES = 3;
const DURACION_MS = { exito: 4000, aviso: 6000, error: 6000 };

function ProveedorNotificaciones({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const temporizadores = useRef(new Map());
  const contador = useRef(0);

  const cerrar = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id));
    temporizadores.current.delete(id);
    setNotificaciones((actuales) => actuales.filter((notificacion) => notificacion.id !== id));
  }, []);

  const notificar = useCallback(
    (mensaje, tipo = 'exito') => {
      contador.current += 1;
      const id = contador.current;

      setNotificaciones((actuales) => [...actuales, { id, mensaje, tipo }].slice(-MAXIMO_VISIBLES));
      temporizadores.current.set(id, setTimeout(() => cerrar(id), DURACION_MS[tipo]));
    },
    [cerrar],
  );

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach((temporizador) => clearTimeout(temporizador));
  }, []);

  const valor = useMemo(
    () => ({
      notificar,
      exito: (mensaje) => notificar(mensaje, 'exito'),
      aviso: (mensaje) => notificar(mensaje, 'aviso'),
      error: (mensaje) => notificar(mensaje, 'error'),
    }),
    [notificar],
  );

  return (
    <ContextoNotificaciones.Provider value={valor}>
      {children}

      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3">
        {notificaciones.map(({ id, mensaje, tipo }) => (
          <Toast key={id} theme={temasToast[tipo]} duration={150} className="pointer-events-auto">
            <div className="flex-1">{mensaje}</div>
            <ToastToggle onDismiss={() => cerrar(id)} aria-label="Cerrar notificación" />
          </Toast>
        ))}
      </div>
    </ContextoNotificaciones.Provider>
  );
}

export default ProveedorNotificaciones;

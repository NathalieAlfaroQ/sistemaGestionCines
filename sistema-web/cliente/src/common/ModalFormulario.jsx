import { useId } from 'react';
import Dialogo from './Dialogo.jsx';

// Los anchos se escriben completos para que Tailwind los detecte
const anchos = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Cuadro de diálogo para formularios cortos (crear o editar algo sin salir de la página).
 * Muestra un título y el contenido que se le pase; no conoce los campos ni cómo se guarda:
 * eso lo resuelve el formulario que se coloque dentro. Ese formulario lleva sus propios
 * botones (Guardar / Cancelar) dentro del <form>, para que Enter lo envíe de forma natural.
 *
 * Escape cierra el cuadro, pero un clic fuera no: así no se pierden por accidente los
 * datos ya escritos.
 *
 * Se muestra mientras esté montado, por eso se usa con renderizado condicional:
 * {mostrar && <ModalFormulario ... />}. Al montarlo de nuevo, el formulario empieza limpio.
 *
 * Props:
 * - titulo:    encabezado del cuadro
 * - alCerrar:  función que se llama al pulsar Escape; quien la recibe debe desmontar el cuadro
 * - ancho:     (opcional) 'sm' | 'md' | 'lg' | 'xl'; por defecto 'md'
 * - children:  el formulario
 *
 * Ejemplo:
 *   {mostrar && (
 *     <ModalFormulario titulo="Crear elemento" alCerrar={() => setMostrar(false)}>
 *       <MiFormulario alEnviar={guardar} alCancelar={() => setMostrar(false)} />
 *     </ModalFormulario>
 *   )}
 */
function ModalFormulario({ titulo, alCerrar, ancho = 'md', children }) {
  const idTitulo = useId();

  return (
    <Dialogo
      idTitulo={idTitulo}
      alCerrar={alCerrar}
      cerrarAlClicFuera={false}
      claseCaja={`w-full ${anchos[ancho] ?? anchos.md} rounded-lg bg-border px-8 py-8`}
    >
      <h2 id={idTitulo} className="mb-6 text-2xl font-bold text-text-color">
        {titulo}
      </h2>

      {children}
    </Dialogo>
  );
}

export default ModalFormulario;

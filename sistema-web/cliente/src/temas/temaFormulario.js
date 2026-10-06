import { createTheme } from 'flowbite-react';

// Estilo común de los campos sobre fondo oscuro. La segunda mitad repite los
// colores con "dark:" para que no cambien si el sistema operativo está en modo oscuro.
const campoOscuro =
  'border-border bg-surface text-text-color placeholder-text-muted focus:border-brand-soft focus:ring-brand-soft ' +
  'dark:border-border dark:bg-surface dark:text-text-color dark:placeholder-text-muted dark:focus:border-brand-soft dark:focus:ring-brand-soft';

export const temaFormulario = createTheme({
  label: { root: { base: 'mb-2 block text-sm font-normal', colors: { default: 'text-text-color' } } },
  textInput: { field: { input: { colors: { gray: campoOscuro } } } },
  textarea: { colors: { gray: campoOscuro } },
  select: { field: { select: { colors: { gray: campoOscuro } } } },
  fileInput: { colors: { gray: campoOscuro } },
  button: { color: { brand: 'bg-brand text-text-color hover:bg-brand-hover' } },
});
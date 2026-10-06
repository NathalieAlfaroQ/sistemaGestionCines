import { createTheme } from 'flowbite-react';
import { campoOscuro } from './temaFormulario.js';

// Colores en hexadecimal, igual que en temaFormulario.js. Marca #3D1D53 · acento #B188CE
const botonNavegacion =
  'flex items-center gap-1 px-3 py-2 text-white enabled:hover:text-[#B188CE] disabled:cursor-not-allowed disabled:opacity-40';

export const temaPaginacion = createTheme({
  label: { root: { base: 'text-sm font-normal', colors: { default: 'text-white' } } },
  select: { field: { select: { colors: { gray: campoOscuro } } } },
  pagination: {
    pages: {
      base: 'inline-flex items-center gap-2',
      previous: { base: botonNavegacion },
      next: { base: botonNavegacion },
      selector: {
        base: 'h-10 w-10 rounded border border-white bg-transparent text-white enabled:hover:bg-[#3D1D53]',
        active: 'border-[#B188CE] bg-[#3D1D53] text-white',
      },
    },
  },
});


export const reemplazoPaginacion = {
  pages: {
    base: 'replace',
    previous: { base: 'replace' },
    next: { base: 'replace' },
    selector: { base: 'replace', active: 'replace' },
  },
};
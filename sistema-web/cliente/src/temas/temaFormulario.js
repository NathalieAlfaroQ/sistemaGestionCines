import { createTheme } from 'flowbite-react';

// Colores en hexadecimal, solo para este formulario: no dependen de los tokens de index.css.
// Al unir las ramas, basta con reemplazar estas clases por las de la paleta.
// Equivalencias: fondo #1F1F24 · campos #141418 · borde #565669 · marca #3D1D53 ·
// marca hover #7B48A0 · acento #B188CE · error #FF383C · éxito #34B35B · aviso #F38E30
export const clasesFormulario = {
  pagina: 'bg-[#1F1F24] text-white',
  acento: 'text-[#B188CE]',
  error: 'text-[#FF383C] dark:text-[#FF383C]',
  exito: 'text-[#34B35B] dark:text-[#34B35B]',
  aviso: 'text-[#F38E30]',
  zonaImagen: 'border-2 border-dashed border-[#565669] bg-[#141418] text-white/70 hover:border-[#B188CE]',
};

// Estilo común de los campos. La segunda mitad repite los colores con "dark:" para que
// no cambien si el sistema operativo está en modo oscuro.
const campoOscuro =
  'border-[#565669] bg-[#141418] text-white placeholder-[#565669] focus:border-[#B188CE] focus:ring-[#B188CE] ' +
  'dark:border-[#565669] dark:bg-[#141418] dark:text-white dark:placeholder-[#565669] dark:focus:border-[#B188CE] dark:focus:ring-[#B188CE]';

// Igual que el anterior, pero con el borde en rojo cuando el campo tiene un error
const campoConError =
  'border-[#FF383C] bg-[#141418] text-white placeholder-[#565669] focus:border-[#FF383C] focus:ring-[#FF383C] ' +
  'dark:border-[#FF383C] dark:bg-[#141418] dark:text-white dark:placeholder-[#565669] dark:focus:border-[#FF383C] dark:focus:ring-[#FF383C]';

export const temaFormulario = createTheme({
  label: { root: { base: 'mb-2 block text-sm font-normal', colors: { default: 'text-white' } } },
  textInput: { field: { input: { colors: { gray: campoOscuro, failure: campoConError } } } },
  textarea: { colors: { gray: campoOscuro } },
  select: { field: { select: { colors: { gray: campoOscuro, failure: campoConError } } } },
  fileInput: { colors: { gray: campoOscuro } },
  button: { color: { brand: 'bg-[#3D1D53] text-white hover:bg-[#7B48A0]' } },
});
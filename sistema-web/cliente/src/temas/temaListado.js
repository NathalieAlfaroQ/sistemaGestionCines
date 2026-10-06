import { createTheme } from 'flowbite-react';

// Acento #B188CE · marca #3D1D53 · fondo del modal #141418 · peligro #FF383C
export const temaListado = createTheme({
  button: {
    color: {
      acento: 'border border-[#B188CE] bg-transparent text-[#B188CE] enabled:hover:bg-[#B188CE]/10',
      brand: 'bg-[#3D1D53] text-white hover:bg-[#7B48A0]',
      peligro: 'bg-[#FF383C] text-white hover:bg-[#F18284]',
    },
  },
  modal: {
    content: { inner: 'bg-[#141418] dark:bg-[#141418]' },
    header: {
      close: {
        base: 'text-[#B188CE] hover:bg-white/10 hover:text-white dark:text-[#B188CE] dark:hover:bg-white/10 dark:hover:text-white',
      },
    },
  },
});
import { createTheme } from 'flowbite-react';

const base =
  'flex w-full max-w-md items-center gap-3 rounded-lg border-2 px-5 py-4 text-base font-semibold text-white shadow-2xl ring-4 ring-black/20 dark:text-white';

const toggle =
  '-m-1.5 ml-auto inline-flex h-8 w-8 rounded-lg bg-transparent p-1.5 text-white hover:bg-white/20 hover:text-white ' +
  'focus:ring-2 focus:ring-white dark:bg-transparent dark:text-white dark:hover:bg-white/20 dark:hover:text-white';

export const temasToast = {
  exito: createTheme({
    root: { base: `${base} border-white/40 bg-success dark:bg-success` },
    toggle: { base: toggle },
  }),
  aviso: createTheme({
    root: { base: `${base} border-white/40 bg-warning dark:bg-warning` },
    toggle: { base: toggle },
  }),
  error: createTheme({
    root: { base: `${base} border-white/40 bg-danger dark:bg-danger` },
    toggle: { base: toggle },
  }),
};
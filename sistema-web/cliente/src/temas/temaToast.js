import { createTheme } from 'flowbite-react';

const base =
  'flex w-full max-w-sm items-center rounded-lg border bg-surface p-4 text-sm font-medium shadow-lg dark:bg-surface';

const toggle =
  '-m-1.5 ml-auto inline-flex h-8 w-8 rounded-lg bg-transparent p-1.5 text-current hover:bg-text-color/10 hover:text-current ' +
  'focus:ring-2 focus:ring-current dark:bg-transparent dark:text-current dark:hover:bg-text-color/10 dark:hover:text-current';

export const temasToast = {
  exito: createTheme({
    root: { base: `${base} border-success text-success dark:text-success` },
    toggle: { base: toggle },
  }),
  aviso: createTheme({
    root: { base: `${base} border-warning text-warning dark:text-warning` },
    toggle: { base: toggle },
  }),
  error: createTheme({
    root: { base: `${base} border-danger text-danger dark:text-danger` },
    toggle: { base: toggle },
  }),
};
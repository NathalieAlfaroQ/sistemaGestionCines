import { createTheme } from 'flowbite-react';

const itemBase =
  'block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 ' +
  'text-text-color hover:bg-brand dark:text-text-color dark:hover:bg-brand';
const itemSeleccionado = 'bg-brand-soft text-text-color hover:bg-brand-soft-hover dark:hover:bg-brand-soft-hover';
const itemDeshabilitado =
  'cursor-not-allowed text-text-muted hover:bg-transparent dark:text-text-muted dark:hover:bg-transparent';
const vistaDeCuadricula = { items: { item: { base: itemBase, selected: itemSeleccionado, disabled: itemDeshabilitado } } };

export const temaCalendario = createTheme({
  datepicker: {
    root: {
      input: {
        field: {
          icon: { svg: 'h-5 w-5 text-text-muted dark:text-text-muted' },
          input: {
            sizes: { md: 'px-3 py-2 text-base' },
            colors: {
              gray:
                'border-border bg-surface text-text-color placeholder-text-muted focus:border-brand-soft focus:ring-brand-soft ' +
                'dark:border-border dark:bg-surface dark:text-text-color dark:placeholder-text-muted ' +
                'dark:focus:border-brand-soft dark:focus:ring-brand-soft',
            },
          },
        },
      },
    },
    popup: {
      root: {
        // El calendario se abre hacia arriba: el campo Fecha queda en la parte baja del modal
        base: 'absolute top-auto bottom-full z-50 block pb-2 pt-0',
        inner: 'inline-block rounded-lg border border-border bg-surface p-4 shadow-lg dark:bg-surface',
      },
      header: {
        title: 'px-2 py-3 text-center font-semibold text-text-color dark:text-text-color',
        selectors: {
          button: {
            base:
              'rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold text-text-color hover:bg-brand ' +
              'focus:outline-none focus:ring-2 focus:ring-brand-soft dark:bg-surface dark:text-text-color dark:hover:bg-brand',
          },
        },
      },
      footer: {
        button: {
          base: 'focus:ring-brand-soft',
          today: 'bg-brand text-text-color hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover',
          clear:
            'border border-border bg-transparent text-text-color hover:bg-white/10 ' +
            'dark:border-border dark:bg-transparent dark:text-text-color dark:hover:bg-white/10',
        },
      },
    },
    views: {
      days: {
        header: { title: 'h-6 text-center text-sm font-medium leading-6 text-text-muted dark:text-text-muted' },
        items: { item: { base: itemBase, selected: itemSeleccionado, disabled: itemDeshabilitado, today: 'border border-brand-soft' } },
      },
      months: vistaDeCuadricula,
      years: vistaDeCuadricula,
      decades: vistaDeCuadricula,
    },
  },
});

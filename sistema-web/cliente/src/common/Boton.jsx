import { forwardRef } from 'react';

// Las clases se escriben completas para que Tailwind las detecte
const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variantes = {
  principal: 'bg-brand text-text-color hover:bg-brand-hover',
  secundario: 'bg-brand-soft text-text-color hover:bg-brand-soft-hover',
  peligro: 'bg-danger text-text-color hover:bg-danger-hover',
  oscuro: 'bg-black text-text-color hover:bg-surface',
  contorno: 'border border-brand-soft text-brand-soft hover:bg-brand-hover hover:text-text-color',
  contornoOscuro: 'border border-black text-text-color hover:bg-black/40',
  contornoPeligro: 'border border-danger text-danger hover:bg-danger hover:text-text-color',
};

const tamanos = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  icono: 'p-2',
};

export function clasesBoton({ variante = 'principal', tamano = 'md', className = '' } = {}) {
  return `${base} ${variantes[variante] ?? variantes.principal} ${tamanos[tamano] ?? tamanos.md} ${className}`.trim();
}

const Boton = forwardRef(function Boton(
  {
    children,
    variante = 'principal',
    tamano = 'md',
    icono = null,
    posicionIcono = 'derecha',
    type = 'button',
    className = '',
    ...resto
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clasesBoton({ variante, tamano, className })}
      {...resto}
    >
      {posicionIcono === 'izquierda' && icono}
      {children}
      {posicionIcono !== 'izquierda' && icono}
    </button>
  );
});

export default Boton;

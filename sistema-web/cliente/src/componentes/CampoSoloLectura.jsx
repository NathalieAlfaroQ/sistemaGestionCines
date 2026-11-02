const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseSoloLectura = 'flex min-h-[2.625rem] items-center rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-text-muted';

function CampoSoloLectura({ id, etiqueta, valor }) {
  return (
    <div>
      <label htmlFor={id} className={claseEtiqueta}>
        {etiqueta}
      </label>
      <output id={id} className={claseSoloLectura}>
        {valor ?? '—'}
      </output>
    </div>
  );
}

export default CampoSoloLectura;

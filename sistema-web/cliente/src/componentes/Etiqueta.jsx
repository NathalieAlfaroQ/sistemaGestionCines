const claseEtiqueta = 'mb-2 block text-sm text-text-color';

function Etiqueta({ id, children }) {
  return (
    <label htmlFor={id} className={claseEtiqueta}>
      {children} <span className="text-danger">*</span>
    </label>
  );
}

export default Etiqueta;

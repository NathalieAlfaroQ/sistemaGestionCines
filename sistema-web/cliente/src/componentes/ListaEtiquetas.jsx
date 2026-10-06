import { clasesFormulario } from '../temas/temaFormulario.js';

// Muestra una lista de valores como etiquetas, sin controles (para páginas de solo lectura)
function ListaEtiquetas({ etiqueta, elementos }) {
  const idEtiqueta = `lista-${etiqueta}`;

  return (
    <div>
      <p id={idEtiqueta} className="mb-2 text-sm">
        {etiqueta}
      </p>

      <ul aria-labelledby={idEtiqueta} className="flex flex-wrap gap-2">
        {elementos.length === 0 && <li className="text-sm text-white/60">—</li>}

        {elementos.map((elemento) => (
          <li key={elemento} className={`rounded px-3 py-1 text-sm ${clasesFormulario.etiqueta}`}>
            {elemento}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListaEtiquetas;
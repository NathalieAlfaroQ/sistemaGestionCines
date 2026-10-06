import { clasesFormulario } from '../temas/temaFormulario.js';

// Muestra una imagen ya guardada, con el mismo tamaño y proporción que su selector
function VistaImagen({ etiqueta, url, claseAncho, claseProporcion }) {
  return (
    <div className={`max-w-full ${claseAncho}`}>
      <p className="mb-2 text-sm">{etiqueta}</p>

      <div
        className={`flex w-full items-center justify-center overflow-hidden rounded-lg ${claseProporcion} ${clasesFormulario.marcoImagen}`}
      >
        {url ? (
          <img src={url} alt={`${etiqueta} de la película`} className="size-full object-cover" />
        ) : (
          <span className="text-sm">Sin imagen</span>
        )}
      </div>
    </div>
  );
}

export default VistaImagen;
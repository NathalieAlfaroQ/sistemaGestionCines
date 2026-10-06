import { useState } from 'react';
import {
  TAMANO_MAXIMO_BYTES,
  TAMANO_MAXIMO_MB,
  TIPOS_PERMITIDOS,
} from '../constantes/imagenesPelicula.js';

function validar(archivo) {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return 'Use una imagen JPEG, PNG o WebP';
  if (archivo.size > TAMANO_MAXIMO_BYTES) return `La imagen supera los ${TAMANO_MAXIMO_MB} MB`;
  return null;
}

function SelectorImagen({ id, etiqueta, ayuda, alCambiar, error, subida }) {
  const [errorLocal, setErrorLocal] = useState(null);

  function alElegir(evento) {
    const archivo = evento.target.files[0] ?? null;
    const problema = archivo ? validar(archivo) : null;

    setErrorLocal(problema);

    if (problema) {
      evento.target.value = '';
      alCambiar(null);
      return;
    }

    alCambiar(archivo);
  }

  const mensajeError = errorLocal ?? error;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-white">{etiqueta}</label>

      <input
        id={id}
        type="file"
        accept={TIPOS_PERMITIDOS.join(',')}
        disabled={subida}
        onChange={alElegir}
        className="w-full px-3 py-2 rounded-lg bg-black text-sm text-white file:mr-4 file:px-3 file:py-1 file:rounded file:border-0 file:bg-boton file:text-white disabled:opacity-50"
      />

      <p className="mt-1 text-xs text-white/60">
        {ayuda}. JPEG, PNG o WebP, máximo {TAMANO_MAXIMO_MB} MB. Se recorta al centro si no coincide la proporción.
      </p>

      {mensajeError && <p className="mt-1 text-sm text-red-400">{mensajeError}</p>}
      {subida && <p className="mt-1 text-sm text-green-400">Imagen subida correctamente</p>}
    </div>
  );
}

export default SelectorImagen;
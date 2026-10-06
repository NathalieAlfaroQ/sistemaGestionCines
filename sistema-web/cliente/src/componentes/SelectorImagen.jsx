import { useState } from 'react';
import { FileInput, HelperText, Label } from 'flowbite-react';
import {
  TAMANO_MAXIMO_BYTES,
  TAMANO_MAXIMO_MB,
  TIPOS_PERMITIDOS,
} from '../constantes/imagenesPelicula.js';
import { clasesFormulario } from '../temas/temaFormulario.js';

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
      <Label htmlFor={id}>{etiqueta}</Label>
      <FileInput id={id} accept={TIPOS_PERMITIDOS.join(',')} disabled={subida} onChange={alElegir} />

      <HelperText>
        {ayuda}. JPEG, PNG o WebP, máximo {TAMANO_MAXIMO_MB} MB. Se recorta al centro si no coincide la proporción.
      </HelperText>
      {mensajeError && <HelperText className={clasesFormulario.error}>{mensajeError}</HelperText>}
      {subida && <HelperText className={clasesFormulario.exito}>Imagen subida correctamente</HelperText>}
    </div>
  );
}

export default SelectorImagen;
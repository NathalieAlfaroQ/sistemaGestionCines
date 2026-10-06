import { useEffect, useState } from 'react';
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

// urlExistente: imagen que la película ya tiene (al editar). Se muestra hasta que se elija otra.
function SelectorImagen({
  id,
  etiqueta,
  ayuda,
  obligatoria,
  claseAncho,
  claseProporcion,
  urlExistente = null,
  alCambiar,
  error,
  subida,
}) {
  const [errorLocal, setErrorLocal] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  // Libera la vista previa anterior cada vez que cambia y cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    };
  }, [vistaPrevia]);

  function alElegir(evento) {
    const archivo = evento.target.files[0] ?? null;
    const problema = archivo ? validar(archivo) : null;

    setErrorLocal(problema);

    if (problema) {
      evento.target.value = '';
      setVistaPrevia(null);
      alCambiar(null);
      return;
    }

    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
    alCambiar(archivo);
  }

  const imagenMostrada = vistaPrevia ?? urlExistente;
  const mensajeError = errorLocal ?? error;
  const claseDeshabilitada = subida ? 'pointer-events-none opacity-50' : '';

  return (
    <div className={`max-w-full ${claseAncho}`}>
      <Label htmlFor={id}>
        {etiqueta} {obligatoria && <span className={clasesFormulario.acento}>*</span>}
      </Label>

      <Label
        htmlFor={id}
        className={`mb-0 flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg ${claseProporcion} ${clasesFormulario.zonaImagen} ${claseDeshabilitada}`}
      >
        {imagenMostrada ? (
          <img
            src={imagenMostrada}
            alt={`Vista previa de ${etiqueta.toLowerCase()}`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <svg className="h-8 w-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="text-sm">Haga clic para elegir una imagen</p>
          </div>
        )}

        <FileInput
          id={id}
          className="hidden"
          accept={TIPOS_PERMITIDOS.join(',')}
          disabled={subida}
          onChange={alElegir}
        />
      </Label>

      <HelperText>
        {ayuda}. JPEG, PNG o WebP, máximo {TAMANO_MAXIMO_MB} MB. Se recorta al centro si no coincide la proporción.
        {urlExistente && ' Haga clic en la imagen para cambiarla.'}
      </HelperText>
      {mensajeError && <HelperText className={clasesFormulario.error}>{mensajeError}</HelperText>}
      {subida && <HelperText className={clasesFormulario.exito}>Imagen subida correctamente</HelperText>}
    </div>
  );
}

export default SelectorImagen;
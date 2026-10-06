import sharp from "sharp";
import { ErrorValidacion } from "../errores/ErrorValidacion.js";

const FORMATOS = {
  poster: { ancho: 600, alto: 900 },
  banner: { ancho: 1600, alto: 900 },
};

const FORMATOS_PERMITIDOS = new Set(["jpeg", "png", "webp"]);
const MAX_PIXELES = 25_000_000;
const CALIDAD_WEBP = 80;

export async function procesarImagen(buffer, tipo) {
  const formato = FORMATOS[tipo];
  if (!formato) {
    throw new Error(`Tipo de imagen desconocido: ${tipo}`);
  }

  try {
    const imagen = sharp(buffer, { limitInputPixels: MAX_PIXELES });

    const metadatos = await imagen.metadata();
    if (!FORMATOS_PERMITIDOS.has(metadatos.format)) {
      throw new ErrorValidacion("Formato no permitido. Use JPEG, PNG o WebP");
    }

    const resultado = await imagen
      .rotate()
      .resize(formato.ancho, formato.alto, { fit: "cover", position: "centre" })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer();

    return { buffer: resultado, tipoContenido: "image/webp", extension: "webp" };
  } catch (error) {
    if (error instanceof ErrorValidacion) throw error;
    throw new ErrorValidacion("El archivo no es una imagen válida");
  }
}
import sharp from "sharp";

const FORMATOS = {
  poster: { ancho: 600, alto: 900 },
  banner: { ancho: 1600, alto: 900 },
};

const FORMATOS_PERMITIDOS = new Set(["jpeg", "png", "webp"]);
const MAX_PIXELES = 25_000_000;
const CALIDAD_WEBP = 80;

export class ImagenInvalidaError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ImagenInvalidaError";
  }
}

export async function procesarImagen(buffer, tipo) {
  const formato = FORMATOS[tipo];
  if (!formato) {
    throw new Error(`Tipo de imagen desconocido: ${tipo}`);
  }

  try {
    const imagen = sharp(buffer, { limitInputPixels: MAX_PIXELES });

    const metadatos = await imagen.metadata();
    if (!FORMATOS_PERMITIDOS.has(metadatos.format)) {
      throw new ImagenInvalidaError("Formato no permitido. Use JPEG, PNG o WebP");
    }

    const resultado = await imagen
      .rotate()
      .resize(formato.ancho, formato.alto, { fit: "cover", position: "centre" })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer();

    return { buffer: resultado, tipoContenido: "image/webp", extension: "webp" };
  } catch (error) {
    if (error instanceof ImagenInvalidaError) throw error;
    throw new ImagenInvalidaError("El archivo no es una imagen válida");
  }
}
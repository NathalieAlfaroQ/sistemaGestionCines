import multer from "multer";

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
const NOMBRE_CAMPO = "imagen";

const cargador = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_BYTES, files: 1 },
}).single(NOMBRE_CAMPO);

export function subidaImagen(req, res, next) {
  cargador(req, res, (error) => {
    if (!error) {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "La imagen supera los 5 MB" });
      }
      return res.status(400).json({ error: "No se pudo recibir el archivo" });
    }

    next(error);
  });
}
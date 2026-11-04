import nodemailer from 'nodemailer';
import { configuracionCorreo } from '../configuracion/correo.js';

// Puerto 465: TLS desde el inicio. Otros puertos (587): la conexión empieza sin cifrar y
// nodemailer la sube a TLS con STARTTLS.
const PUERTO_TLS_DIRECTO = 465;

const transporte = nodemailer.createTransport({
  host: configuracionCorreo.servidor,
  port: configuracionCorreo.puerto,
  secure: configuracionCorreo.puerto === PUERTO_TLS_DIRECTO,
  auth: {
    user: configuracionCorreo.usuario,
    pass: configuracionCorreo.contrasena,
  },
});

// Envía un correo HTML. adjuntos usa el formato de nodemailer:
// [{ filename, content, contentType, cid? }] — con cid el adjunto se puede mostrar dentro del HTML.
export async function enviarCorreo({ para, asunto, html, adjuntos = [] }) {
  await transporte.sendMail({
    from: configuracionCorreo.remitente,
    to: para,
    subject: asunto,
    html,
    attachments: adjuntos,
  });
}

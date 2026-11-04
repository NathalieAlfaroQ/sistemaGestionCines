import { createRequire } from 'node:module';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { ErrorNoAutenticado } from '../errores/ErrorNoAutenticado.js';
import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { listarBoletosDeFactura } from '../repositorios/repositorioCompra.js';
import { formatearFechaHora } from '../utilidades/fechas.js';
import { enviarCorreo } from './servicioCorreo.js';
import { COLOR_MARCA, ESTILO_CELDA, ESTILO_PARRAFO, ESTILO_TABLA, plantillaCorreo } from '../plantillas/plantillaCorreo.js';

// Las fuentes estándar de PDF no tienen el símbolo ₡: se usa DejaVu, instalada como paquete de npm
const require = createRequire(import.meta.url);
const FUENTE_NORMAL = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
const FUENTE_NEGRITA = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');

const NOMBRE_CINE = 'Cine Aurora';
const COLOR_TEXTO_SECUNDARIO = '#565669';

const formateadorColones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

export function formatearMonto(monto) {
  return formateadorColones.format(monto);
}

// Texto del QR de cada boleto: identifica la función y el asiento (el par es único en DETALLES_FACTURA)
export function textoQr(idProyeccion, idAsiento) {
  return `CINEAURORA-P${idProyeccion}-A${idAsiento}`;
}

const ENTIDADES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Todo texto que viene de la BD se escapa antes de meterlo en el HTML del correo
function escaparHtml(texto) {
  return String(texto).replaceAll(/[&<>"']/g, (caracter) => ENTIDADES_HTML[caracter]);
}

function validarIds(idFactura, idCliente) {
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ErrorNoAutenticado('Tu sesión no es válida. Inicia sesión de nuevo.');
  }
  if (!Number.isInteger(idFactura) || idFactura <= 0) {
    throw new ErrorValidacion('El id de la compra no es válido');
  }
}

async function obtenerComprobante(idFactura, idCliente) {
  const filas = await listarBoletosDeFactura(idFactura, idCliente);
  if (filas.length === 0) {
    throw new ErrorNoEncontrado('La compra no existe');
  }

  const [, total, fechaCompra, codigoPago, titulo, clasificacion, fechaFuncion, sede, sala, formato] = filas[0];

  return {
    idFactura,
    total,
    fechaCompra: formatearFechaHora(fechaCompra),
    codigoPago,
    titulo,
    clasificacion,
    fechaFuncion: formatearFechaHora(fechaFuncion),
    sede,
    sala,
    formato,
    boletos: filas.map((fila) => ({
      asiento: `${fila[12]}${fila[13]}`,
      tipo: fila[14],
      monto: fila[15],
      textoQr: textoQr(fila[10], fila[11]),
    })),
  };
}

// Imagen PNG del QR de cada boleto, en el mismo orden que comprobante.boletos
async function generarQrs(boletos) {
  return Promise.all(boletos.map((boleto) => QRCode.toBuffer(boleto.textoQr, { width: 300, margin: 1 })));
}

// PDFKit escribe el documento como un flujo (stream): se juntan las partes en un solo Buffer
function documentoABuffer(documento) {
  return new Promise((resolve, reject) => {
    const partes = [];
    documento.on('data', (parte) => partes.push(parte));
    documento.on('end', () => resolve(Buffer.concat(partes)));
    documento.on('error', reject);
  });
}

function dibujarEncabezado(documento, subtitulo) {
  const ancho = documento.page.width;
  documento.rect(0, 0, ancho, 56).fill(COLOR_MARCA);
  documento.fillColor('#FFFFFF').font('negrita').fontSize(18).text(NOMBRE_CINE.toUpperCase(), 0, 14, {
    width: ancho,
    align: 'center',
  });
  documento.font('normal').fontSize(9).text(subtitulo, 0, 36, { width: ancho, align: 'center' });
  documento.fillColor('#000000').moveDown(0);
  documento.x = documento.page.margins.left;
  documento.y = 76;
}

function dibujarDato(documento, etiqueta, valor) {
  documento.font('normal').fontSize(8).fillColor(COLOR_TEXTO_SECUNDARIO).text(etiqueta.toUpperCase());
  documento.font('negrita').fontSize(10).fillColor('#000000').text(valor);
  documento.moveDown(0.4);
}

function dibujarResumen(documento, comprobante) {
  dibujarEncabezado(documento, 'Resumen de compra');

  dibujarDato(documento, 'Película', `${comprobante.titulo} (${comprobante.clasificacion})`);
  dibujarDato(documento, 'Función', comprobante.fechaFuncion);
  dibujarDato(documento, 'Lugar', `${comprobante.sede} · ${comprobante.sala} · ${comprobante.formato}`);
  dibujarDato(documento, 'Factura', `N.º ${comprobante.idFactura} · ${comprobante.fechaCompra}`);
  dibujarDato(documento, 'Código de pago', comprobante.codigoPago ?? '—');

  documento.moveDown(0.4).font('negrita').fontSize(11).text('Boletos');
  documento.font('normal').fontSize(10);
  for (const boleto of comprobante.boletos) {
    documento.text(`Asiento ${boleto.asiento} · ${boleto.tipo}`, { continued: true });
    documento.text(formatearMonto(boleto.monto), { align: 'right' });
  }

  documento.moveDown(0.6).font('negrita').fontSize(13);
  documento.text('Total', { continued: true }).text(formatearMonto(comprobante.total), { align: 'right' });
}

function dibujarBoleto(documento, comprobante, boleto, qr, numero) {
  dibujarEncabezado(documento, `Boleto ${numero} de ${comprobante.boletos.length}`);

  const anchoUtil = documento.page.width - documento.page.margins.left - documento.page.margins.right;

  documento.font('negrita').fontSize(14).text(comprobante.titulo, { width: anchoUtil });
  documento.font('normal').fontSize(9).fillColor(COLOR_TEXTO_SECUNDARIO);
  documento.text(`${comprobante.clasificacion} · ${comprobante.formato}`);
  documento.moveDown(0.6).fillColor('#000000');

  dibujarDato(documento, 'Función', comprobante.fechaFuncion);
  dibujarDato(documento, 'Lugar', `${comprobante.sede} · ${comprobante.sala}`);

  documento.font('normal').fontSize(8).fillColor(COLOR_TEXTO_SECUNDARIO).text('ASIENTO');
  documento.font('negrita').fontSize(26).fillColor(COLOR_MARCA).text(boleto.asiento);
  documento.font('normal').fontSize(10).fillColor('#000000').text(`${boleto.tipo} · ${formatearMonto(boleto.monto)}`);

  const ladoQr = 130;
  documento.image(qr, (documento.page.width - ladoQr) / 2, documento.y + 10, { width: ladoQr });

  // El pie va dentro del margen inferior: sin quitar el margen, PDFKit lo pasaría a una página nueva
  documento.page.margins.bottom = 0;
  documento.font('normal').fontSize(7).fillColor(COLOR_TEXTO_SECUNDARIO);
  documento.text(`Factura N.º ${comprobante.idFactura} · Presenta este código en la entrada de la sala`, 0, documento.page.height - 22, {
    width: documento.page.width,
    align: 'center',
    lineBreak: false,
  });
}

// Primera página: resumen. Luego una página tamaño A6 por boleto (cómoda de mostrar en el celular).
async function generarPdf(comprobante, qrs) {
  const documento = new PDFDocument({ size: 'A6', margin: 24, autoFirstPage: false });
  const buffer = documentoABuffer(documento);

  documento.registerFont('normal', FUENTE_NORMAL);
  documento.registerFont('negrita', FUENTE_NEGRITA);
  documento.info.Title = `Boletos - ${NOMBRE_CINE} - Factura ${comprobante.idFactura}`;

  documento.addPage();
  dibujarResumen(documento, comprobante);

  comprobante.boletos.forEach((boleto, indice) => {
    documento.addPage();
    dibujarBoleto(documento, comprobante, boleto, qrs[indice], indice + 1);
  });

  documento.end();
  return buffer;
}

// El correo usa la plantilla base (plantillas/plantillaCorreo.js); aquí solo se arma su contenido.
function generarHtmlCorreo(comprobante, nombreCliente) {
  const filasBoletos = comprobante.boletos
    .map(
      (boleto, indice) => `
        <tr>
          <td style="${ESTILO_CELDA} padding: 12px 0; border-bottom: 1px solid #eaebed;" valign="middle">
            <strong style="font-size: 18px; color: ${COLOR_MARCA};">Asiento ${escaparHtml(boleto.asiento)}</strong><br>
            ${escaparHtml(boleto.tipo)} · ${escaparHtml(formatearMonto(boleto.monto))}
          </td>
          <td style="${ESTILO_CELDA} padding: 12px 0; border-bottom: 1px solid #eaebed; text-align: right;" align="right" valign="middle">
            <img src="cid:qr-${indice}" alt="Código QR del asiento ${escaparHtml(boleto.asiento)}" width="120" height="120" style="display: inline-block;">
          </td>
        </tr>`
    )
    .join('');

  const contenido = `
    <p style="${ESTILO_PARRAFO}">Hola ${escaparHtml(nombreCliente)},</p>
    <p style="${ESTILO_PARRAFO}">¡Gracias por tu compra! Estos son tus boletos. También van adjuntos en PDF.</p>
    <p style="${ESTILO_PARRAFO} margin-bottom: 4px; font-size: 20px; font-weight: bold;">${escaparHtml(comprobante.titulo)}</p>
    <p style="${ESTILO_PARRAFO} color: ${COLOR_TEXTO_SECUNDARIO};">
      ${escaparHtml(comprobante.fechaFuncion)}<br>
      ${escaparHtml(comprobante.sede)} · ${escaparHtml(comprobante.sala)} · ${escaparHtml(comprobante.formato)}
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="${ESTILO_TABLA} border-collapse: collapse; margin-bottom: 16px;" width="100%">${filasBoletos}
    </table>
    <p style="${ESTILO_PARRAFO} font-size: 18px; text-align: right;"><strong>Total: ${escaparHtml(formatearMonto(comprobante.total))}</strong></p>
    <p style="${ESTILO_PARRAFO} margin-bottom: 0; font-size: 14px; color: ${COLOR_TEXTO_SECUNDARIO};">
      Factura N.º ${comprobante.idFactura} · ${escaparHtml(comprobante.fechaCompra)}<br>
      Presenta el código QR de cada boleto en la entrada de la sala.
    </p>`;

  return plantillaCorreo({
    titulo: `Tus boletos - ${NOMBRE_CINE}`,
    preencabezado: `Tus boletos para ${escaparHtml(comprobante.titulo)} · ${escaparHtml(comprobante.fechaFuncion)}`,
    contenido,
    pie: `${NOMBRE_CINE} · Este correo es el comprobante de tu compra.`,
  });
}

function nombreArchivoPdf(idFactura) {
  return `boletos-cine-aurora-${idFactura}.pdf`;
}

// Envía el comprobante al correo del cliente. cliente: { idCliente, nombre, correo }
export async function enviarComprobante(idFactura, cliente) {
  const comprobante = await obtenerComprobante(idFactura, cliente.idCliente);
  const qrs = await generarQrs(comprobante.boletos);
  const pdf = await generarPdf(comprobante, qrs);

  await enviarCorreo({
    para: cliente.correo,
    asunto: `Tus boletos para ${comprobante.titulo} - ${NOMBRE_CINE}`,
    html: generarHtmlCorreo(comprobante, cliente.nombre),
    adjuntos: [
      { filename: nombreArchivoPdf(idFactura), content: pdf, contentType: 'application/pdf' },
      ...qrs.map((qr, indice) => ({
        filename: `qr-asiento-${comprobante.boletos[indice].asiento}.png`,
        content: qr,
        contentType: 'image/png',
        cid: `qr-${indice}`,
      })),
    ],
  });
}

// PDF de los boletos para el botón "Descargar boletos"
export async function generarPdfBoletos(idFactura, idCliente) {
  validarIds(idFactura, idCliente);

  const comprobante = await obtenerComprobante(idFactura, idCliente);
  const qrs = await generarQrs(comprobante.boletos);

  return { nombreArchivo: nombreArchivoPdf(idFactura), pdf: await generarPdf(comprobante, qrs) };
}
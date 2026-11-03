import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositorios/repositorioCompra.js', () => ({
  listarBoletosDeFactura: vi.fn(),
}));
vi.mock('../../src/servicios/servicioCorreo.js', () => ({
  enviarCorreo: vi.fn(),
}));

import {
  enviarComprobante,
  formatearMonto,
  generarPdfBoletos,
  textoQr,
} from '../../src/servicios/servicioComprobante.js';
import { listarBoletosDeFactura } from '../../src/repositorios/repositorioCompra.js';
import { enviarCorreo } from '../../src/servicios/servicioCorreo.js';
import { ErrorNoAutenticado } from '../../src/errores/ErrorNoAutenticado.js';
import { ErrorNoEncontrado } from '../../src/errores/ErrorNoEncontrado.js';
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js';

const ID_FACTURA = 15;
const ID_CLIENTE = 21;

// Filas como las devuelve listarBoletosDeFactura (ver el orden de columnas en repositorioCompra.js)
function fila(idAsiento, fila, numero, tipo, monto) {
  return [
    ID_FACTURA, 9200, '2026-11-02 20:15', 'cmvyv4g1q0lc3k7017mehiy0h', 'F1: La Película', 'PG',
    '2026-11-05 21:10', 'Cine Aurora Alba', 'Sala 3', '3D', 7, idAsiento, fila, numero, tipo, monto,
  ];
}

const filasCompra = [fila(101, 'B', 5, 'Adulto', 3300), fila(102, 'B', 6, 'Adulto', 3300), fila(103, 'B', 7, 'Niño', 2600)];

// Cada página de PDFKit es un objeto "/Type /Page" (el índice es "/Type /Pages")
function contarPaginas(pdf) {
  return (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length;
}

describe('SCRUM-XX servicioComprobante', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listarBoletosDeFactura.mockResolvedValue(filasCompra);
    enviarCorreo.mockResolvedValue();
  });

  describe('textoQr', () => {
    it('identifica la función y el asiento del boleto', () => {
      expect(textoQr(7, 101)).toBe('CINEAURORA-P7-A101');
    });
  });

  describe('formatearMonto', () => {
    it('muestra colones con el símbolo ₡ y sin decimales', () => {
      expect(formatearMonto(3300)).toMatch(/^₡3\s300$/);
      expect(formatearMonto(9200)).toMatch(/^₡9\s200$/);
    });
  });

  describe('generarPdfBoletos', () => {
    it('busca la factura filtrando por el cliente de la sesión', async () => {
      await generarPdfBoletos(ID_FACTURA, ID_CLIENTE);

      expect(listarBoletosDeFactura).toHaveBeenCalledWith(ID_FACTURA, ID_CLIENTE);
    });

    it('genera un PDF con una página de resumen y una por boleto', async () => {
      const { nombreArchivo, pdf } = await generarPdfBoletos(ID_FACTURA, ID_CLIENTE);

      expect(nombreArchivo).toBe('boletos-cine-aurora-15.pdf');
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(contarPaginas(pdf)).toBe(1 + filasCompra.length);
    });

    it('responde 404 si la factura no existe o es de otro cliente', async () => {
      listarBoletosDeFactura.mockResolvedValue([]);

      await expect(generarPdfBoletos(ID_FACTURA, ID_CLIENTE)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    });

    it('rechaza una sesión sin idCliente sin consultar la BD', async () => {
      await expect(generarPdfBoletos(ID_FACTURA, undefined)).rejects.toBeInstanceOf(ErrorNoAutenticado);
      expect(listarBoletosDeFactura).not.toHaveBeenCalled();
    });

    it.each([Number.NaN, 0, -3, 1.5])('rechaza el id de factura %s sin consultar la BD', async (idFactura) => {
      await expect(generarPdfBoletos(idFactura, ID_CLIENTE)).rejects.toBeInstanceOf(ErrorValidacion);
      expect(listarBoletosDeFactura).not.toHaveBeenCalled();
    });
  });

  describe('enviarComprobante', () => {
    const cliente = { idCliente: ID_CLIENTE, nombre: 'Ana', correo: 'ana@correo.com' };

    it('manda el correo al cliente con la película en el asunto', async () => {
      await enviarComprobante(ID_FACTURA, cliente);

      const correo = enviarCorreo.mock.calls[0][0];
      expect(correo.para).toBe('ana@correo.com');
      expect(correo.asunto).toBe('Tus boletos para F1: La Película - Cine Aurora');
    });

    it('adjunta el PDF y un QR por boleto, enlazado al HTML con cid', async () => {
      await enviarComprobante(ID_FACTURA, cliente);

      const { adjuntos, html } = enviarCorreo.mock.calls[0][0];
      expect(adjuntos.map((adjunto) => adjunto.filename)).toEqual([
        'boletos-cine-aurora-15.pdf',
        'qr-asiento-B5.png',
        'qr-asiento-B6.png',
        'qr-asiento-B7.png',
      ]);
      expect(adjuntos[0].contentType).toBe('application/pdf');

      const qrs = adjuntos.filter((adjunto) => adjunto.cid);
      expect(qrs.map((qr) => qr.cid)).toEqual(['qr-0', 'qr-1', 'qr-2']);
      for (const qr of qrs) {
        expect(html).toContain(`src="cid:${qr.cid}"`);
        // Firma de un archivo PNG
        expect(qr.content.subarray(1, 4).toString()).toBe('PNG');
      }
    });

    it('incluye en el HTML los asientos, los tipos de boleto y el total', async () => {
      await enviarComprobante(ID_FACTURA, cliente);

      const { html } = enviarCorreo.mock.calls[0][0];
      expect(html).toContain('Asiento B5');
      expect(html).toContain('Niño');
      expect(html).toMatch(/Total: ₡9\s200/);
      expect(html).toContain('Factura N.º 15');
    });

    it('escapa el HTML de los datos para que no se interpreten como etiquetas', async () => {
      listarBoletosDeFactura.mockResolvedValue([
        fila(101, 'B', 5, 'Adulto', 3300).map((valor, indice) => (indice === 4 ? 'Película <script>' : valor)),
      ]);

      await enviarComprobante(ID_FACTURA, { ...cliente, nombre: 'Ana <b>Mora</b>' });

      const { html } = enviarCorreo.mock.calls[0][0];
      expect(html).toContain('Hola Ana &lt;b&gt;Mora&lt;/b&gt;,');
      expect(html).toContain('Película &lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('propaga el error si el correo no se puede enviar (la compra decide qué hacer)', async () => {
      enviarCorreo.mockRejectedValue(new Error('SMTP caído'));

      await expect(enviarComprobante(ID_FACTURA, cliente)).rejects.toThrow('SMTP caído');
    });
  });
});

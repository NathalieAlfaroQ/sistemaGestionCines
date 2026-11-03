import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock('nodemailer', () => ({ default: { createTransport } }));
vi.mock('../../src/configuracion/correo.js', () => ({
  configuracionCorreo: {
    servidor: 'smtp.prueba.com',
    puerto: 587,
    usuario: 'cine@prueba.com',
    contrasena: 'secreta',
    remitente: 'Cine Aurora <cine@prueba.com>',
  },
}));

const { enviarCorreo } = await import('../../src/servicios/servicioCorreo.js');

// El transporte se crea una sola vez, al importar el módulo. Se guardan sus argumentos aquí porque
// la configuración de Vitest (clearMocks) borra el historial de los mocks antes de cada prueba.
const opcionesTransporte = createTransport.mock.calls[0]?.[0];

describe('SCRUM-94 servicioCorreo', () => {
  beforeEach(() => {
    sendMail.mockReset();
  });

  it('crea el transporte con STARTTLS para el puerto 587', () => {
    expect(opcionesTransporte).toEqual({
      host: 'smtp.prueba.com',
      port: 587,
      secure: false,
      auth: { user: 'cine@prueba.com', pass: 'secreta' },
    });
  });

  it('envía el correo desde el remitente configurado, con sus adjuntos', async () => {
    const adjuntos = [{ filename: 'boletos.pdf', content: Buffer.from('pdf') }];

    await enviarCorreo({ para: 'ana@correo.com', asunto: 'Tus boletos', html: '<p>Hola</p>', adjuntos });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'Cine Aurora <cine@prueba.com>',
      to: 'ana@correo.com',
      subject: 'Tus boletos',
      html: '<p>Hola</p>',
      attachments: adjuntos,
    });
  });

  it('sin adjuntos manda una lista vacía', async () => {
    await enviarCorreo({ para: 'ana@correo.com', asunto: 'Hola', html: '<p>Hola</p>' });

    expect(sendMail.mock.calls[0][0].attachments).toEqual([]);
  });

  it('propaga el error del servidor de correo', async () => {
    sendMail.mockRejectedValue(new Error('Conexión rechazada'));

    await expect(enviarCorreo({ para: 'a@b.com', asunto: 'x', html: 'x' })).rejects.toThrow('Conexión rechazada');
  });
});
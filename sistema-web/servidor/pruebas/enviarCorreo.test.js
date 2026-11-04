import { describe, it, expect, vi } from 'vitest'
import { enviarCorreoContrasena } from '../src/enviarCorreo.js'

vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: '123' })
      })
    }
  }
})

describe('enviarCorreoContrasena', () => {
  it('debe enviar el correo de REGISTRO con el asunto correcto', async () => {
    await enviarCorreoContrasena('correo@test.com', 'Juan', 'Ab3Xy9', 'CLIENTE', 'REGISTRO')
    
    const nodemailer = await import('nodemailer')
    const transporterMock = nodemailer.default.createTransport()
    
    expect(transporterMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'correo@test.com',
        subject: 'Cuenta registrada'
      })
    )
  })

  it('debe enviar el correo de RECUPERACION con el asunto correcto', async () => {
    await enviarCorreoContrasena('correo@test.com', 'Ana', 'XyZ123', 'CLIENTE', 'RECUPERACION')
    
    const nodemailer = await import('nodemailer')
    const transporterMock = nodemailer.default.createTransport()
    
    expect(transporterMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'correo@test.com',
        subject: 'Contraseña temporal'
      })
    )
  })

  it('debe escapar el nombre para evitar inyección HTML (XSS)', async () => {
    const nombreMalicioso = '<script>alert("hack")</script>'
    await enviarCorreoContrasena('correo@test.com', nombreMalicioso, 'Ab3Xy9', 'CLIENTE')
    
    const nodemailer = await import('nodemailer')
    const transporterMock = nodemailer.default.createTransport()
    
    const llamada = transporterMock.sendMail.mock.calls[0][0]
    const htmlEnviado = llamada.html

    expect(htmlEnviado).toContain('&lt;script&gt;')
    expect(htmlEnviado).not.toContain('<script>')
  })
})
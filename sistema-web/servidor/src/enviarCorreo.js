import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function enviarCorreoContrasena(correo, nombre, contrasena, tipoUsuario) {
  let asunto = ''
  let mensajeBienvenida = ''

  if (tipoUsuario === 'CLIENTE') {
    asunto = 'Cuenta registrada'
    mensajeBienvenida = 'Tu cuenta ha sido registrada exitosamente.'
  } else if (tipoUsuario === 'EMPLEADO') {
    asunto = 'Has sido registrado como empleado'
    mensajeBienvenida = 'Has sido registrado como empleado del sistema.'
  } else if (tipoUsuario === 'ADMINISTRADOR') {
    asunto = 'Has sido registrado como administrador'
    mensajeBienvenida = 'Has sido registrado como administrador del sistema.'
  } else {
    asunto = 'Credenciales de acceso'
    mensajeBienvenida = 'Tu cuenta ha sido creada.'
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: correo,
    subject: asunto,
    html: `
      <h2>Hola ${nombre},</h2>
      <p>${mensajeBienvenida}</p>
      <p>Tu contraseña temporal es: <strong style="font-size:20px">${contrasena}</strong></p>
      <p>Esta contraseña es válida por <strong>20 minutos</strong>.</p>
      <p>Por favor inicia sesión y cámbiala lo antes posible.</p>
    `
  })
}
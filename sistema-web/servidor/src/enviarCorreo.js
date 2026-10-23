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

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function enviarCorreoContrasena(correo, nombre, contrasena, tipoUsuario, motivo = 'REGISTRO') {
  let asunto = ''
  let cuerpoHTML = ''
  
  const nombreSeguro = escaparHTML(nombre) 
  // CAMBIAR A ENLACE CORRECTO
  const enlaceLogin = `${process.env.CLIENT_URL || 'http://localhost:5173'}/iniciar-sesion`

  if (motivo === 'RECUPERACION') {
    asunto = 'Contraseña temporal'
    cuerpoHTML = `
      <h2>Hola ${nombreSeguro},</h2>
      <p>Tu contraseña temporal es: <strong style="font-size:20px">${contrasena}</strong></p>
      <p>La contraseña tiene una validez de 20 minutos.</p>
      <p>Por favor inicia sesión para cambiar la contraseña:</p>
      <p><a href="${enlaceLogin}">${enlaceLogin}</a></p>
    `
  } else {
    asunto = 'Cuenta registrada'
    let mensajeBienvenida = 'Tu cuenta ha sido registrada exitosamente.'

    if (tipoUsuario === 'EMPLEADO') {
      mensajeBienvenida = 'Has sido registrado como empleado exitosamente.'

    } else if (tipoUsuario === 'ADMINISTRADOR') {
      mensajeBienvenida = 'Has sido registrado como administrador exitosamente.'
    }

    cuerpoHTML = `
      <h2>Hola ${nombreSeguro},</h2>
      <p>${mensajeBienvenida}</p>
      <p>Tu contraseña temporal es: <strong style="font-size:20px">${contrasena}</strong></p>
      <p>La contraseña tiene una validez de 20 minutos.</p>
      <p>Por favor inicia sesión para cambiar la contraseña:</p>
      <p><a href="${enlaceLogin}">${enlaceLogin}</a></p>
    `
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: correo,
    subject: asunto,
    html: cuerpoHTML
  })
}
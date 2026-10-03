import 'dotenv/config'
import { enviarCorreoContrasena } from './enviarCorreo.js'

async function main() {
  try {
    await enviarCorreoContrasena(
      'cineaurora.sistema@gmail.com',  
      'Ab3Xy9',
      'CLIENTE'
    )
    console.log('✅ Correo enviado. Revisa la bandeja (y spam).')
  } catch (err) {
    console.error('❌ Error al enviar:', err.message)
  }
}

main()
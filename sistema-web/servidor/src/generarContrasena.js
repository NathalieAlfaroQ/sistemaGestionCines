export function generarContrasena() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  let contrasena = ''

  for (let i = 0; i < 6; i++) {
    contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  
  return contrasena
}
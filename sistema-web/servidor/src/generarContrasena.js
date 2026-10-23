export function generarContrasena() {
  const caracteres = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

  let contrasena = ''

  for (let i = 0; i < 8; i++) {
    contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  
  return contrasena
}
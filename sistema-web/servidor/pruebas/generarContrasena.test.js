import { describe, it, expect } from 'vitest'
import { generarContrasena } from '../src/generarContrasena.js'

describe('generarContrasena', () => {
  it('debe generar una contraseña de 8 caracteres', () => {
    const pass = generarContrasena()
    expect(pass).toHaveLength(8)
  })

  it('debe generar contraseñas diferentes en cada llamada', () => {
    const pass1 = generarContrasena()
    const pass2 = generarContrasena()
    expect(pass1).not.toBe(pass2) 
  })

  it('solo debe contener caracteres alfanuméricos permitidos', () => {
    const pass = generarContrasena()
    const regexPermitidos = /^[A-HJ-NP-Za-hj-np-z2-9]+$/
    expect(pass).toMatch(regexPermitidos)
  })
})
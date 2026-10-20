import { describe, it, expect, vi, afterEach } from 'vitest'

describe('configuracionJwt', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('expone el secreto y la expiración configurados', async () => {
    vi.resetModules()

    const { configuracionJwt } = await import('../../src/configuracion/jwt.js')

    expect(configuracionJwt).toEqual({ secreto: 'secreto-de-prueba', expiracion: '1h' })
  })

  it('falla al cargarse si falta JWT_SECRETO', async () => {
    vi.stubEnv('JWT_SECRETO', '')
    vi.resetModules()

    await expect(import('../../src/configuracion/jwt.js')).rejects.toThrow('JWT_SECRETO')
  })

  it('falla al cargarse si falta JWT_EXPIRACION', async () => {
    vi.stubEnv('JWT_EXPIRACION', '')
    vi.resetModules()

    await expect(import('../../src/configuracion/jwt.js')).rejects.toThrow('JWT_EXPIRACION')
  })
})
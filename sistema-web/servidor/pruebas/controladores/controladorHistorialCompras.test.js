import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/servicios/servicioHistorialCompras.js', () => ({ consultarHistorialCompras: vi.fn() }))

import * as servicio from '../../src/servicios/servicioHistorialCompras.js'
import { listarHistorialCompras } from '../../src/controladores/controladorHistorialCompras.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarHistorialCompras', () => {
  it('responde con las compras del usuario de la sesión', async () => {
    servicio.consultarHistorialCompras.mockResolvedValue([[8, 'La Odisea']])
    const req = { usuario: { idCliente: 3 } }
    const res = { json: vi.fn() }
    const siguiente = vi.fn()

    await listarHistorialCompras(req, res, siguiente)

    expect(servicio.consultarHistorialCompras).toHaveBeenCalledWith({ idCliente: 3 })
    expect(res.json).toHaveBeenCalledWith([[8, 'La Odisea']])
    expect(siguiente).not.toHaveBeenCalled()
  })

  it('pasa el error al manejador', async () => {
    const fallo = new Error('ORA-00942')
    servicio.consultarHistorialCompras.mockRejectedValue(fallo)
    const res = { json: vi.fn() }
    const siguiente = vi.fn()

    await listarHistorialCompras({ usuario: {} }, res, siguiente)

    expect(siguiente).toHaveBeenCalledWith(fallo)
    expect(res.json).not.toHaveBeenCalled()
  })
})
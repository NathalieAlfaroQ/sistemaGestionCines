import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/servicios/servicioCartelera.js', () => ({
  consultarCartelera: vi.fn(),
  consultarSedes: vi.fn(),
}))

import * as servicio from '../../src/servicios/servicioCartelera.js'
import { listarCartelera, listarSedes } from '../../src/controladores/controladorCartelera.js'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('listarSedes', () => {
  it('responde con las sedes', async () => {
    servicio.consultarSedes.mockResolvedValue([[1, 'Cine Alba']])
    const res = { json: vi.fn() }
    const siguiente = vi.fn()

    await listarSedes({}, res, siguiente)

    expect(res.json).toHaveBeenCalledWith([[1, 'Cine Alba']])
    expect(siguiente).not.toHaveBeenCalled()
  })

  it('pasa el error al manejador', async () => {
    const fallo = new Error('ORA-00942')
    servicio.consultarSedes.mockRejectedValue(fallo)
    const res = { json: vi.fn() }
    const siguiente = vi.fn()

    await listarSedes({}, res, siguiente)

    expect(siguiente).toHaveBeenCalledWith(fallo)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('listarCartelera', () => {
  it('responde con las películas de la sede indicada en la consulta', async () => {
    servicio.consultarCartelera.mockResolvedValue([[10, 'Dune']])
    const res = { json: vi.fn() }
    const siguiente = vi.fn()

    await listarCartelera({ query: { idSede: '2' } }, res, siguiente)

    expect(servicio.consultarCartelera).toHaveBeenCalledWith('2')
    expect(res.json).toHaveBeenCalledWith([[10, 'Dune']])
  })

  it('pasa el error al manejador', async () => {
    const fallo = new Error('sede inválida')
    servicio.consultarCartelera.mockRejectedValue(fallo)
    const res = { json: vi.fn() }
    const siguiente = vi.fn()

    await listarCartelera({ query: {} }, res, siguiente)

    expect(siguiente).toHaveBeenCalledWith(fallo)
  })
})

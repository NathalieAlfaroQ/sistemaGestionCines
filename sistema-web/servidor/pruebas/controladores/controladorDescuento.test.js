import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/servicios/servicioDescuento.js', () => ({ obtenerDescuentos: vi.fn() }))

import * as servicio from '../../src/servicios/servicioDescuento.js'
import { listarDescuentos } from '../../src/controladores/controladorDescuento.js'
import { ErrorValidacion } from '../../src/errores/ErrorValidacion.js'

function crearRes() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listarDescuentos', () => {
  it('responde con la lista y pasa los filtros del query al servicio', async () => {
    servicio.obtenerDescuentos.mockResolvedValue([[1, 'Lunes de cine']])
    const query = { busqueda: 'lunes', idSede: '4', idPelicula: '7', fechaInicio: '2026-11-16', fechaFin: '2026-11-22', estado: 'todos' }
    const res = crearRes()

    await listarDescuentos({ query }, res)

    expect(servicio.obtenerDescuentos).toHaveBeenCalledWith(query)
    expect(res.json).toHaveBeenCalledWith([[1, 'Lunes de cine']])
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde 400 con el mensaje cuando un filtro no es válido', async () => {
    servicio.obtenerDescuentos.mockRejectedValue(new ErrorValidacion('El filtro de cine no es válido'))
    const res = crearRes()

    await listarDescuentos({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El filtro de cine no es válido' })
  })

  it('responde 500 con el mensaje de la historia si falla la carga', async () => {
    servicio.obtenerDescuentos.mockRejectedValue(new Error('ORA-00942'))
    const res = crearRes()

    await listarDescuentos({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo cargar la lista de descuentos, reintente después' })
  })
})
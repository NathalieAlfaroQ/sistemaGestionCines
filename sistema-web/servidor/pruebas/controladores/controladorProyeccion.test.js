import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/servicios/servicioProyeccion.js', () => ({
  obtenerProyecciones: vi.fn(),
  registrarProyeccion: vi.fn(),
}))

import * as servicio from '../../src/servicios/servicioProyeccion.js'
import { crearProyeccion, listarProyecciones } from '../../src/controladores/controladorProyeccion.js'
import { ErrorConflicto } from '../../src/errores/ErrorConflicto.js'
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

describe('listarProyecciones', () => {
  it('responde con la lista y pasa los filtros del query al servicio', async () => {
    servicio.obtenerProyecciones.mockResolvedValue([[1, 'Dune']])
    const query = {
      busqueda: 'dune',
      idPelicula: '2',
      idSala: '3',
      idSede: '4',
      fecha: '2026-11-05',
      hora: '14:30',
      estado: 'todas',
    }
    const res = crearRes()

    await listarProyecciones({ query }, res)

    expect(servicio.obtenerProyecciones).toHaveBeenCalledWith(query)
    expect(res.json).toHaveBeenCalledWith([[1, 'Dune']])
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responde con lista vacía cuando no hay proyecciones', async () => {
    servicio.obtenerProyecciones.mockResolvedValue([])
    const res = crearRes()

    await listarProyecciones({ query: {} }, res)

    expect(res.json).toHaveBeenCalledWith([])
  })

  it('responde 400 con el mensaje de un ErrorValidacion', async () => {
    servicio.obtenerProyecciones.mockRejectedValue(new ErrorValidacion('El filtro de fecha no es válido'))
    const res = crearRes()

    await listarProyecciones({ query: { fecha: 'x' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El filtro de fecha no es válido' })
  })

  it('responde 500 genérico ante un error inesperado, sin exponer el detalle', async () => {
    servicio.obtenerProyecciones.mockRejectedValue(new Error('ORA-03113 detalle interno'))
    const res = crearRes()

    await listarProyecciones({ query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudieron obtener las proyecciones' })
    expect(console.error).toHaveBeenCalled()
  })
})

describe('crearProyeccion', () => {
  const body = { idPelicula: 5, idSala: 3, fecha: '2099-11-05', hora: '14:30' }

  it('responde 201 con el id de la proyección creada', async () => {
    servicio.registrarProyeccion.mockResolvedValue(77)
    const res = crearRes()

    await crearProyeccion({ body }, res)

    expect(servicio.registrarProyeccion).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ idProyeccion: 77 })
  })

  it('responde 400 con el mensaje de un ErrorValidacion', async () => {
    servicio.registrarProyeccion.mockRejectedValue(new ErrorValidacion('La sala es obligatoria'))
    const res = crearRes()

    await crearProyeccion({ body: {} }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sala es obligatoria' })
  })

  it('responde 409 con el mensaje de un ErrorConflicto', async () => {
    servicio.registrarProyeccion.mockRejectedValue(new ErrorConflicto('La sala ya tiene una proyección en ese horario'))
    const res = crearRes()

    await crearProyeccion({ body }, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sala ya tiene una proyección en ese horario' })
  })

  it('responde 500 genérico ante un error inesperado, sin exponer el detalle', async () => {
    servicio.registrarProyeccion.mockRejectedValue(new Error('ORA-03113 detalle interno'))
    const res = crearRes()

    await crearProyeccion({ body }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo crear la proyección' })
    expect(console.error).toHaveBeenCalled()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/servicios/servicioReserva.js', () => ({
  consultarAsientos: vi.fn(),
  consultarHorarios: vi.fn(),
  consultarPelicula: vi.fn(),
  verificarSeleccion: vi.fn(),
}));

const servicio = await import('../../src/servicios/servicioReserva.js');
const { listarHorarios, verAsientos, verificarAsientos, verPelicula } = await import(
  '../../src/controladores/controladorReserva.js'
);

function crearRespuesta() {
  return { json: vi.fn() };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('SCRUM-93 controladorReserva', () => {
  it.each([
    ['verPelicula', verPelicula, 'consultarPelicula', { params: { id: '3' } }, [3]],
    ['listarHorarios', listarHorarios, 'consultarHorarios', { params: { id: '3' }, query: { fecha: '2026-10-30' } }, [3, '2026-10-30']],
    ['verAsientos', verAsientos, 'consultarAsientos', { params: { id: '7' } }, [7]],
    ['verificarAsientos', verificarAsientos, 'verificarSeleccion', { params: { id: '7' }, body: { asientos: [1] } }, [7, { asientos: [1] }]],
  ])('%s responde con lo que devuelve el servicio', async (_nombre, controlador, funcion, req, argumentos) => {
    servicio[funcion].mockResolvedValue({ ok: true });
    const res = crearRespuesta();
    const next = vi.fn();

    await controlador(req, res, next);

    expect(servicio[funcion]).toHaveBeenCalledWith(...argumentos);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['verPelicula', verPelicula, 'consultarPelicula'],
    ['listarHorarios', listarHorarios, 'consultarHorarios'],
    ['verAsientos', verAsientos, 'consultarAsientos'],
    ['verificarAsientos', verificarAsientos, 'verificarSeleccion'],
  ])('%s pasa los errores al manejador central', async (_nombre, controlador, funcion) => {
    const error = new Error('falla');
    servicio[funcion].mockRejectedValue(error);
    const res = crearRespuesta();
    const next = vi.fn();

    await controlador({ params: { id: '1' }, query: {}, body: {} }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
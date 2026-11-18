import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/servicios/servicioReserva.js', () => ({
  cancelarReserva: vi.fn(),
  consultarAsientos: vi.fn(),
  consultarReserva: vi.fn(),
  crearReserva: vi.fn(),
  consultarHorarios: vi.fn(),
  consultarPelicula: vi.fn(),
}));

const servicio = await import('../../src/servicios/servicioReserva.js');
const {
  cancelarMiReserva,
  listarHorarios,
  reservarAsientos,
  verAsientos,
  verMiReserva,
  verPelicula,
} = await import('../../src/controladores/controladorReserva.js');

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

describe('SCRUM-93 controladorReserva: reserva temporal', () => {
  function crearRespuestaCompleta() {
    const res = { json: vi.fn(), end: vi.fn() };
    res.status = vi.fn(() => res);
    return res;
  }

  const usuario = { idCliente: 4 };

  it('reservarAsientos responde 201 con lo que devuelve el servicio', async () => {
    servicio.crearReserva.mockResolvedValue({ total: 6600, segundosRestantes: 300 });
    const res = crearRespuestaCompleta();
    const next = vi.fn();
    const body = { asientos: [10], boletos: [] };

    await reservarAsientos({ usuario, params: { id: '7' }, body }, res, next);

    expect(servicio.crearReserva).toHaveBeenCalledWith(usuario, 7, body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ total: 6600, segundosRestantes: 300 });
    expect(next).not.toHaveBeenCalled();
  });

  it('verMiReserva envuelve la reserva (o null) en { reserva }', async () => {
    servicio.consultarReserva.mockResolvedValue(null);
    const res = crearRespuestaCompleta();

    await verMiReserva({ usuario }, res, vi.fn());

    expect(servicio.consultarReserva).toHaveBeenCalledWith(usuario);
    expect(res.json).toHaveBeenCalledWith({ reserva: null });
  });

  it('cancelarMiReserva responde 204 sin cuerpo', async () => {
    servicio.cancelarReserva.mockResolvedValue();
    const res = crearRespuestaCompleta();

    await cancelarMiReserva({ usuario }, res, vi.fn());

    expect(servicio.cancelarReserva).toHaveBeenCalledWith(usuario);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it.each([
    ['reservarAsientos', reservarAsientos, 'crearReserva'],
    ['verMiReserva', verMiReserva, 'consultarReserva'],
    ['cancelarMiReserva', cancelarMiReserva, 'cancelarReserva'],
  ])('%s pasa los errores al manejador central', async (_nombre, controlador, funcion) => {
    const error = new Error('falla');
    servicio[funcion].mockRejectedValue(error);
    const res = crearRespuestaCompleta();
    const next = vi.fn();

    await controlador({ usuario, params: { id: '7' }, body: {} }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositorios/repositorioReserva.js', () => ({
  contarAsientosDeSala: vi.fn(),
  listarAsientos: vi.fn(),
  listarAsientosOcupados: vi.fn(),
  listarHorarios: vi.fn(),
  listarTiposBoleto: vi.fn(),
  obtenerPelicula: vi.fn(),
  obtenerProyeccionVigente: vi.fn(),
}));

vi.mock('../../src/servicios/almacenamientoImagenes.js', () => ({
  obtenerUrlImagen: vi.fn((clave) => (clave ? `https://bucket/${clave}` : null)),
}));

const repositorio = await import('../../src/repositorios/repositorioReserva.js');
const { ErrorConflicto } = await import('../../src/errores/ErrorConflicto.js');
const { ErrorNoEncontrado } = await import('../../src/errores/ErrorNoEncontrado.js');
const { ErrorValidacion } = await import('../../src/errores/ErrorValidacion.js');
const {
  MENSAJE_ASIENTO_NO_DISPONIBLE,
  MENSAJE_FALTAN_ASIENTOS,
  consultarAsientos,
  consultarHorarios,
  consultarPelicula,
  verificarSeleccion,
} = await import('../../src/servicios/servicioReserva.js');

// 08:00 UTC = 02:00 en Costa Rica (UTC-6)
const AHORA_UTC = new Date('2026-10-28T08:00:00Z');
const AHORA_CR = '2026-10-28 02:00:00';

const PROYECCION = [7, 3, '2026-10-28 19:30', 'Cine Aurora Alba', 'Sala 1', '2D'];
const TIPOS_BOLETO = [
  [1, 'Adulto', 3300],
  [2, 'Niño', 2600],
  [3, 'Tercera edad', 2600],
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AHORA_UTC);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('SCRUM-93 servicioReserva: consultarPelicula', () => {
  it('rechaza un id inválido sin consultar la BD', async () => {
    await expect(consultarPelicula(Number('abc'))).rejects.toBeInstanceOf(ErrorValidacion);
    expect(repositorio.obtenerPelicula).not.toHaveBeenCalled();
  });

  it('lanza ErrorNoEncontrado si la película no existe o está borrada', async () => {
    repositorio.obtenerPelicula.mockResolvedValue(null);
    await expect(consultarPelicula(3)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it('devuelve el encabezado con las URLs de las imágenes y usa la hora de Costa Rica', async () => {
    repositorio.obtenerPelicula.mockResolvedValue({
      fila: [3, 'F1', 155, 'PG', 'Sinopsis', 'posters/a.webp', null],
      generos: ['Acción', 'Suspenso'],
      idiomas: ['Inglés'],
      formatos: ['2D', '3D'],
    });

    const resultado = await consultarPelicula(3);

    expect(repositorio.obtenerPelicula).toHaveBeenCalledWith(3, AHORA_CR);
    expect(resultado).toEqual({
      pelicula: [3, 'F1', 155, 'PG', 'Sinopsis', 'https://bucket/posters/a.webp', null],
      generos: ['Acción', 'Suspenso'],
      subtitulada: true,
      formatos: ['2D', '3D'],
    });
  });

  it.each([
    ['solo en español', ['Español'], false],
    ['sin idiomas registrados', [], false],
    ['en español y otro idioma', ['Español', 'Inglés'], true],
  ])('marca como subtitulada una película %s: %j → %s', async (_caso, idiomas, esperado) => {
    repositorio.obtenerPelicula.mockResolvedValue({ fila: [3], generos: [], idiomas, formatos: [] });
    const { subtitulada } = await consultarPelicula(3);
    expect(subtitulada).toBe(esperado);
  });
});

describe('SCRUM-93 servicioReserva: consultarHorarios', () => {
  it('usa la fecha de hoy en Costa Rica cuando no se envía fecha', async () => {
    repositorio.listarHorarios.mockResolvedValue([]);
    await consultarHorarios(3, undefined);
    expect(repositorio.listarHorarios).toHaveBeenCalledWith(3, '2026-10-28', AHORA_CR);
  });

  it('no se adelanta a la fecha UTC: a las 20:00 de Costa Rica sigue siendo el mismo día', async () => {
    vi.setSystemTime(new Date('2026-10-29T02:00:00Z'));
    repositorio.listarHorarios.mockResolvedValue([]);
    await consultarHorarios(3, '');
    expect(repositorio.listarHorarios).toHaveBeenCalledWith(3, '2026-10-28', '2026-10-28 20:00:00');
  });

  it('devuelve las filas del repositorio para una fecha futura', async () => {
    const filas = [[7, 1, 'Cine Aurora Alba', 'San José', 1, '2D', '19:30']];
    repositorio.listarHorarios.mockResolvedValue(filas);
    await expect(consultarHorarios(3, '2026-10-30')).resolves.toBe(filas);
  });

  it.each([
    ['30-10-2026', 'La fecha debe tener el formato AAAA-MM-DD'],
    ['2026-02-30', 'La fecha no es válida'],
    ['2026-10-27', 'La fecha no puede ser anterior a hoy'],
  ])('rechaza la fecha %s', async (fecha, mensaje) => {
    await expect(consultarHorarios(3, fecha)).rejects.toThrow(mensaje);
    expect(repositorio.listarHorarios).not.toHaveBeenCalled();
  });
});

describe('SCRUM-93 servicioReserva: consultarAsientos', () => {
  it('lanza ErrorNoEncontrado si la función no está vigente', async () => {
    repositorio.obtenerProyeccionVigente.mockResolvedValue(null);
    await expect(consultarAsientos(7)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect(repositorio.listarAsientos).not.toHaveBeenCalled();
  });

  it('devuelve la función, el mapa y los tipos de boleto', async () => {
    const asientos = [
      [10, 'A', 1, 0],
      [11, 'A', 2, 1],
    ];
    repositorio.obtenerProyeccionVigente.mockResolvedValue(PROYECCION);
    repositorio.listarAsientos.mockResolvedValue(asientos);
    repositorio.listarTiposBoleto.mockResolvedValue(TIPOS_BOLETO);

    await expect(consultarAsientos(7)).resolves.toEqual({
      proyeccion: PROYECCION,
      asientos,
      tiposBoleto: TIPOS_BOLETO,
    });
    expect(repositorio.obtenerProyeccionVigente).toHaveBeenCalledWith(7, AHORA_CR);
  });
});

describe('SCRUM-93 servicioReserva: verificarSeleccion', () => {
  const seleccionValida = {
    asientos: [10, 11, 12],
    boletos: [
      { idTipoBoleto: 1, cantidad: 2 },
      { idTipoBoleto: 2, cantidad: 1 },
      { idTipoBoleto: 3, cantidad: 0 },
    ],
  };

  function prepararBdValida() {
    repositorio.obtenerProyeccionVigente.mockResolvedValue(PROYECCION);
    repositorio.listarTiposBoleto.mockResolvedValue(TIPOS_BOLETO);
    repositorio.contarAsientosDeSala.mockResolvedValue(3);
    repositorio.listarAsientosOcupados.mockResolvedValue([]);
  }

  it('devuelve el total calculado con los precios de la BD', async () => {
    prepararBdValida();
    await expect(verificarSeleccion(7, seleccionValida)).resolves.toEqual({ total: 3300 * 2 + 2600 });
    expect(repositorio.contarAsientosDeSala).toHaveBeenCalledWith(7, [10, 11, 12]);
  });

  it('muestra "Te faltan asientos por seleccionar" si hay menos asientos que boletos', async () => {
    await expect(
      verificarSeleccion(7, { ...seleccionValida, asientos: [10, 11] })
    ).rejects.toThrow(MENSAJE_FALTAN_ASIENTOS);
    expect(repositorio.obtenerProyeccionVigente).not.toHaveBeenCalled();
  });

  it('rechaza más asientos que boletos', async () => {
    await expect(
      verificarSeleccion(7, { ...seleccionValida, asientos: [10, 11, 12, 13] })
    ).rejects.toThrow('Seleccionaste más asientos que boletos');
  });

  it.each([
    ['sin asientos', { asientos: [] }, 'Debes seleccionar al menos un asiento'],
    ['un asiento inválido', { asientos: [10, -1, 12] }, 'Los asientos no son válidos'],
    ['asientos repetidos', { asientos: [10, 10, 12] }, 'Hay asientos repetidos en la selección'],
    ['una cantidad decimal', { boletos: [{ idTipoBoleto: 1, cantidad: 1.5 }] }, 'Los boletos no son válidos'],
    [
      'tipos repetidos',
      { boletos: [{ idTipoBoleto: 1, cantidad: 1 }, { idTipoBoleto: 1, cantidad: 2 }] },
      'Hay tipos de boleto repetidos',
    ],
    ['todas las cantidades en cero', { boletos: [{ idTipoBoleto: 1, cantidad: 0 }] }, 'Debes elegir al menos un boleto'],
  ])('rechaza %s', async (_caso, cambios, mensaje) => {
    await expect(verificarSeleccion(7, { ...seleccionValida, ...cambios })).rejects.toThrow(mensaje);
  });

  it('lanza ErrorNoEncontrado si la función ya empezó o no existe', async () => {
    repositorio.obtenerProyeccionVigente.mockResolvedValue(null);
    await expect(verificarSeleccion(7, seleccionValida)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it('rechaza un tipo de boleto que no existe en la BD', async () => {
    prepararBdValida();
    const seleccion = { asientos: [10], boletos: [{ idTipoBoleto: 99, cantidad: 1 }] };
    await expect(verificarSeleccion(7, seleccion)).rejects.toThrow('El tipo de boleto no es válido');
  });

  it('rechaza asientos de otra sala', async () => {
    prepararBdValida();
    repositorio.contarAsientosDeSala.mockResolvedValue(2);
    await expect(verificarSeleccion(7, seleccionValida)).rejects.toThrow(
      'Algún asiento no pertenece a la sala de la función'
    );
    expect(repositorio.listarAsientosOcupados).not.toHaveBeenCalled();
  });

  it('lanza ErrorConflicto con el mensaje de la historia si un asiento ya se vendió', async () => {
    prepararBdValida();
    repositorio.listarAsientosOcupados.mockResolvedValue([11]);

    const promesa = verificarSeleccion(7, seleccionValida);
    await expect(promesa).rejects.toBeInstanceOf(ErrorConflicto);
    await expect(promesa).rejects.toThrow(MENSAJE_ASIENTO_NO_DISPONIBLE);
  });
});
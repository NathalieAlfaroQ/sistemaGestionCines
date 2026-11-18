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

vi.mock('../../src/repositorios/repositorioReservaAsientos.js', () => ({
  MINUTOS_RESERVA: 5,
  RESTRICCION_ASIENTO_RESERVADO: 'PK_RESERVAS_ASIENTOS',
  borrarReservaCliente: vi.fn(),
  borrarReservasVencidas: vi.fn(),
  insertarReserva: vi.fn(),
  obtenerReservaCliente: vi.fn(),
}));

// La transacción falsa ejecuta las operaciones con una conexión de mentira
const conexion = { falsa: true };
vi.mock('../../src/configuracion/baseDatos.js', () => ({
  ejecutarTransaccion: vi.fn(async (operaciones) => operaciones(conexion)),
}));

vi.mock('../../src/servicios/almacenamientoImagenes.js', () => ({
  obtenerUrlImagen: vi.fn((clave) => (clave ? `https://bucket/${clave}` : null)),
}));

const repositorio = await import('../../src/repositorios/repositorioReserva.js');
const reservas = await import('../../src/repositorios/repositorioReservaAsientos.js');
const { ejecutarTransaccion } = await import('../../src/configuracion/baseDatos.js');
const { ErrorNoAutenticado } = await import('../../src/errores/ErrorNoAutenticado.js');
const { ErrorConflicto } = await import('../../src/errores/ErrorConflicto.js');
const { ErrorNoEncontrado } = await import('../../src/errores/ErrorNoEncontrado.js');
const { ErrorValidacion } = await import('../../src/errores/ErrorValidacion.js');
const {
  MENSAJE_ASIENTO_NO_DISPONIBLE,
  MENSAJE_FALTAN_ASIENTOS,
  consultarAsientos,
  consultarHorarios,
  consultarPelicula,
  calcularPrecios,
  armarCompraReservada,
  cancelarReserva,
  consultarReserva,
  crearReserva,
  mapaPrecios,
  obtenerIdCliente,
  obtenerPreciosFuncion,
  repartirBoletos,
  verificarSeleccion,
} = await import('../../src/servicios/servicioReserva.js');

// 08:00 UTC = 02:00 en Costa Rica (UTC-6)
const AHORA_UTC = new Date('2026-10-28T08:00:00Z');
const AHORA_CR = '2026-10-28 02:00:00';

// La sala cuesta 3300; los tipos de boleto traen su descuento en porcentaje
const PROYECCION = [7, 3, '2026-10-28 19:30', 'Cine Aurora Alba', 'Sala 1', '2D', 3300];
const TIPOS_BOLETO = [
  [1, 'Adulto', 0],
  [2, 'Niño', 20],
  [3, 'Tercera edad', 20],
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
      tiposBoleto: [
        [1, 'Adulto', 3300],
        [2, 'Niño', 2640],
        [3, 'Tercera edad', 2640],
      ],
    });
    expect(repositorio.obtenerProyeccionVigente).toHaveBeenCalledWith(7, AHORA_CR);
  });
});

describe('SCRUM-93 servicioReserva: calcularPrecios', () => {
  it('aplica el descuento de cada tipo sobre el monto de la sala y redondea al colón', () => {
    expect(calcularPrecios([[1, 'Adulto', 0], [2, 'Niño', 20]], 3333)).toEqual([
      [1, 'Adulto', 3333],
      [2, 'Niño', 2666],
    ]);
  });
});

describe('SCRUM-93 servicioReserva: mapaPrecios', () => {
  it('da por id el monto a cobrar y el descuento en colones', () => {
    const precios = mapaPrecios([[1, 'Adulto', 0], [2, 'Niño', 20]], 3300);
    expect(precios.get(1)).toEqual({ monto: 3300, descuento: 0 });
    expect(precios.get(2)).toEqual({ monto: 2640, descuento: 660 });
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
    await expect(verificarSeleccion(7, seleccionValida)).resolves.toEqual({ total: 3300 * 2 + 2640 });
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

describe('SCRUM-93 servicioReserva: obtenerIdCliente', () => {
  it('devuelve el idCliente del token', () => {
    expect(obtenerIdCliente({ idCliente: 4 })).toBe(4);
  });

  it.each([
    ['sin usuario', undefined],
    ['sin idCliente (personal o token viejo)', { tipoUsuario: 'EMPLEADO' }],
    ['idCliente inválido', { idCliente: 0 }],
  ])('rechaza %s', (_caso, usuario) => {
    expect(() => obtenerIdCliente(usuario)).toThrow(ErrorNoAutenticado);
  });
});

describe('SCRUM-93 servicioReserva: repartirBoletos', () => {
  it('asigna los tipos en orden y devuelve los asientos ordenados por id', () => {
    const boletos = [
      { idTipoBoleto: 1, cantidad: 2 },
      { idTipoBoleto: 2, cantidad: 1 },
    ];
    expect(repartirBoletos([12, 10, 11], boletos)).toEqual([
      { idAsiento: 10, idTipoBoleto: 1 },
      { idAsiento: 11, idTipoBoleto: 2 },
      { idAsiento: 12, idTipoBoleto: 1 },
    ]);
  });
});

describe('SCRUM-93 servicioReserva: crearReserva', () => {
  const usuario = { idCliente: 4 };
  const seleccion = {
    asientos: [11, 10],
    boletos: [
      { idTipoBoleto: 1, cantidad: 1 },
      { idTipoBoleto: 2, cantidad: 1 },
    ],
  };

  function prepararBdValida() {
    repositorio.obtenerProyeccionVigente.mockResolvedValue(PROYECCION);
    repositorio.listarTiposBoleto.mockResolvedValue(TIPOS_BOLETO);
    repositorio.contarAsientosDeSala.mockResolvedValue(2);
    repositorio.listarAsientosOcupados.mockResolvedValue([]);
  }

  it('borra vencidas y la reserva anterior, inserta la nueva y devuelve total y segundos', async () => {
    prepararBdValida();

    await expect(crearReserva(usuario, 7, seleccion)).resolves.toEqual({
      total: 3300 + 2640,
      segundosRestantes: 300,
    });

    expect(repositorio.listarAsientosOcupados).toHaveBeenCalledWith(7, [11, 10], 4);
    // Solo las vencidas de los asientos que se reservan, no las de todo el cine
    expect(reservas.borrarReservasVencidas).toHaveBeenCalledWith(conexion, 7, [11, 10]);
    expect(reservas.borrarReservaCliente).toHaveBeenCalledWith(conexion, 4);
    expect(reservas.insertarReserva).toHaveBeenCalledWith(
      conexion,
      4,
      7,
      [
        { idAsiento: 10, idTipoBoleto: 2 },
        { idAsiento: 11, idTipoBoleto: 1 },
      ],
      5
    );

    // El orden importa: primero se libera, después se inserta
    const orden = [
      reservas.borrarReservasVencidas.mock.invocationCallOrder[0],
      reservas.borrarReservaCliente.mock.invocationCallOrder[0],
      reservas.insertarReserva.mock.invocationCallOrder[0],
    ];
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
  });

  it('no abre la transacción si la selección no es válida', async () => {
    prepararBdValida();
    repositorio.listarAsientosOcupados.mockResolvedValue([10]);

    await expect(crearReserva(usuario, 7, seleccion)).rejects.toBeInstanceOf(ErrorConflicto);
    expect(ejecutarTransaccion).not.toHaveBeenCalled();
  });

  it('no deja reservar sin un cliente en la sesión', async () => {
    await expect(crearReserva({}, 7, seleccion)).rejects.toBeInstanceOf(ErrorNoAutenticado);
    expect(repositorio.obtenerProyeccionVigente).not.toHaveBeenCalled();
  });

  it('convierte el ORA-00001 de la PK en 409 con el mensaje de asiento no disponible', async () => {
    prepararBdValida();
    const duplicado = Object.assign(new Error('ORA-00001: unique constraint (X.PK_RESERVAS_ASIENTOS) violated'), {
      errorNum: 1,
    });
    reservas.insertarReserva.mockRejectedValueOnce(duplicado);

    const promesa = crearReserva(usuario, 7, seleccion);
    await expect(promesa).rejects.toBeInstanceOf(ErrorConflicto);
    await expect(promesa).rejects.toThrow(MENSAJE_ASIENTO_NO_DISPONIBLE);
  });

  it('deja pasar otros errores de la BD', async () => {
    prepararBdValida();
    const otro = Object.assign(new Error('ORA-12541: no listener'), { errorNum: 12541 });
    reservas.insertarReserva.mockRejectedValueOnce(otro);

    await expect(crearReserva(usuario, 7, seleccion)).rejects.toBe(otro);
  });
});

describe('SCRUM-93 servicioReserva: consultarReserva', () => {
  it('devuelve null si no hay reserva vigente', async () => {
    reservas.obtenerReservaCliente.mockResolvedValue([]);
    await expect(consultarReserva({ idCliente: 4 })).resolves.toBeNull();
    expect(reservas.obtenerReservaCliente).toHaveBeenCalledWith(4);
  });

  it('agrupa los boletos por tipo y toma los segundos más bajos', async () => {
    reservas.obtenerReservaCliente.mockResolvedValue([
      [7, 10, 1, 120],
      [7, 11, 1, 119],
      [7, 12, 2, 120],
    ]);

    await expect(consultarReserva({ idCliente: 4 })).resolves.toEqual({
      idProyeccion: 7,
      asientos: [10, 11, 12],
      boletos: [
        { idTipoBoleto: 1, cantidad: 2 },
        { idTipoBoleto: 2, cantidad: 1 },
      ],
      segundosRestantes: 119,
    });
  });

  it('nunca devuelve segundos negativos', async () => {
    reservas.obtenerReservaCliente.mockResolvedValue([[7, 10, 1, -1]]);
    const reserva = await consultarReserva({ idCliente: 4 });
    expect(reserva.segundosRestantes).toBe(0);
  });
});

describe('SCRUM-93 servicioReserva: cancelarReserva', () => {
  it('borra la reserva del cliente en una transacción', async () => {
    await cancelarReserva({ idCliente: 4 });
    expect(reservas.borrarReservaCliente).toHaveBeenCalledWith(conexion, 4);
  });

  it('exige un cliente en la sesión', async () => {
    await expect(cancelarReserva({})).rejects.toBeInstanceOf(ErrorNoAutenticado);
    expect(ejecutarTransaccion).not.toHaveBeenCalled();
  });
});

describe('SCRUM-93 servicioReserva: obtenerPreciosFuncion', () => {
  it('devuelve el precio de cada tipo de boleto con el monto de la sala', async () => {
    repositorio.obtenerProyeccionVigente.mockResolvedValue(PROYECCION);
    repositorio.listarTiposBoleto.mockResolvedValue(TIPOS_BOLETO);

    const precios = await obtenerPreciosFuncion(7);

    expect(precios.get(1)).toEqual({ monto: 3300, descuento: 0 });
    expect(precios.get(2)).toEqual({ monto: 2640, descuento: 660 });
    expect(repositorio.obtenerProyeccionVigente).toHaveBeenCalledWith(7, AHORA_CR);
  });

  it('lanza ErrorNoEncontrado si la función ya empezó', async () => {
    repositorio.obtenerProyeccionVigente.mockResolvedValue(null);
    await expect(obtenerPreciosFuncion(7)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect(repositorio.listarTiposBoleto).not.toHaveBeenCalled();
  });
});

describe('SCRUM-93 servicioReserva: armarCompraReservada', () => {
  const precios = mapaPrecios(TIPOS_BOLETO, 3300);

  it('pone el precio a cada asiento reservado y calcula el total, sin tocar la BD', () => {
    expect(
      armarCompraReservada(
        [
          [10, 1, 1],
          [11, 2, 1],
          [12, 1, 1],
        ],
        precios
      )
    ).toEqual({
      asientos: [10, 11, 12],
      boletos: [
        { idTipoBoleto: 1, cantidad: 2 },
        { idTipoBoleto: 2, cantidad: 1 },
      ],
      detalles: [
        { idAsiento: 10, idTipoBoleto: 1, monto: 3300, descuento: 0 },
        { idAsiento: 11, idTipoBoleto: 2, monto: 2640, descuento: 660 },
        { idAsiento: 12, idTipoBoleto: 1, monto: 3300, descuento: 0 },
      ],
      total: 3300 * 2 + 2640,
    });
    expect(repositorio.obtenerProyeccionVigente).not.toHaveBeenCalled();
    expect(repositorio.listarTiposBoleto).not.toHaveBeenCalled();
  });

  it('rechaza un tipo de boleto que ya no existe', () => {
    expect(() => armarCompraReservada([[10, 99]], precios)).toThrow('El tipo de boleto no es válido');
  });
});

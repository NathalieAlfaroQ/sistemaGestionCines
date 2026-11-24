import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/configuracion/baseDatos.js', () => ({
  ejecutar: vi.fn(),
}));

const { ejecutar } = await import('../../src/configuracion/baseDatos.js');
const {
  armarBindsLista,
  contarAsientosDeSala,
  listarAsientos,
  listarAsientosOcupados,
  listarHorarios,
  listarTiposBoleto,
  obtenerPelicula,
  obtenerProyeccionVigente,
} = await import('../../src/repositorios/repositorioReserva.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('SCRUM-93 repositorioReserva: armarBindsLista', () => {
  it('arma un marcador y un valor por id', () => {
    expect(armarBindsLista([5, 8, 13])).toEqual({
      marcadores: ':asiento0, :asiento1, :asiento2',
      valores: { asiento0: 5, asiento1: 8, asiento2: 13 },
    });
  });
});

describe('SCRUM-93 repositorioReserva: consultas', () => {
  it('obtenerPelicula devuelve null sin pedir géneros si la película no existe', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [] });
    await expect(obtenerPelicula(3, '2026-10-28 02:00:00')).resolves.toBeNull();
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });

  it('obtenerPelicula junta la fila con géneros, idiomas y formatos', async () => {
    const fila = [3, 'F1', 155, 'PG', 'Sinopsis', null, null];
    ejecutar
      .mockResolvedValueOnce({ rows: [fila] })
      .mockResolvedValueOnce({ rows: [['Acción'], ['Suspenso']] })
      .mockResolvedValueOnce({ rows: [['Inglés']] })
      .mockResolvedValueOnce({ rows: [['2D'], ['3D']] });

    await expect(obtenerPelicula(3, '2026-10-28 02:00:00')).resolves.toEqual({
      fila,
      generos: ['Acción', 'Suspenso'],
      idiomas: ['Inglés'],
      formatos: ['2D', '3D'],
    });
    expect(ejecutar.mock.calls[3][1]).toEqual({ idPelicula: 3, ahora: '2026-10-28 02:00:00' });
  });

  it('listarHorarios pasa película, día y hora actual', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [['fila']] });
    await expect(listarHorarios(3, '2026-10-30', '2026-10-28 02:00:00')).resolves.toEqual([['fila']]);
    expect(ejecutar.mock.calls[0][1]).toEqual({ idPelicula: 3, fecha: '2026-10-30', ahora: '2026-10-28 02:00:00' });
  });

  it('obtenerProyeccionVigente devuelve la fila o null', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [['fila']] }).mockResolvedValueOnce({ rows: [] });
    await expect(obtenerProyeccionVigente(7, 'ahora')).resolves.toEqual(['fila']);
    await expect(obtenerProyeccionVigente(7, 'ahora')).resolves.toBeNull();
  });

  it('listarAsientos y listarTiposBoleto devuelven las filas', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [[10, 'A', 1, 0]] }).mockResolvedValueOnce({ rows: [[1, 'Adulto', 0]] });
    await expect(listarAsientos(7)).resolves.toEqual([[10, 'A', 1, 0]]);
    await expect(listarTiposBoleto()).resolves.toEqual([[1, 'Adulto', 0]]);
  });

  it('contarAsientosDeSala usa un bind por asiento', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [[2]] });

    await expect(contarAsientosDeSala(7, [10, 11])).resolves.toBe(2);

    const [sql, binds] = ejecutar.mock.calls[0];
    expect(sql).toContain('IN (:asiento0, :asiento1)');
    expect(binds).toEqual({ idProyeccion: 7, asiento0: 10, asiento1: 11 });
  });

  it('listarAsientosOcupados devuelve solo los ids', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [[11], [12]] });
    await expect(listarAsientosOcupados(7, [10, 11, 12])).resolves.toEqual([11, 12]);
  });
});

describe('SCRUM-93 repositorioReserva: reservas temporales cuentan como ocupadas', () => {
  it('el mapa marca ocupado lo vendido y lo reservado vigente', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [] });
    await listarAsientos(7);

    const [sql, binds] = ejecutar.mock.calls[0];
    expect(sql).toMatch(/LEFT JOIN DETALLES_FACTURA df/);
    expect(sql).toMatch(/LEFT JOIN RESERVAS_ASIENTOS r/);
    expect(sql).toMatch(/r\.FECHA_EXPIRACION > SYSDATE/);
    expect(sql).toMatch(/df\.ID_ASIENTO IS NULL AND r\.ID_ASIENTO IS NULL THEN 0 ELSE 1/);
    expect(binds).toEqual({ idProyeccion: 7 });
  });

  it('listarAsientosOcupados busca en las facturas y en las reservas vigentes', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [] });
    await listarAsientosOcupados(7, [10, 11]);

    const [sql] = ejecutar.mock.calls[0];
    expect(sql).toMatch(/FROM DETALLES_FACTURA/);
    expect(sql).toMatch(/UNION/);
    expect(sql).toMatch(/FROM RESERVAS_ASIENTOS/);
    expect(sql).toMatch(/FECHA_EXPIRACION > SYSDATE/);
    expect(sql.match(/ID_ASIENTO IN \(:asiento0, :asiento1\)/g)).toHaveLength(2);
  });

  it('listarAsientosOcupados no cuenta la reserva del propio cliente', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [] });
    await listarAsientosOcupados(7, [10, 11], 4);

    const [sql, binds] = ejecutar.mock.calls[0];
    expect(sql).toMatch(/ID_CLIENTE <> :idCliente/);
    expect(binds).toEqual({ idProyeccion: 7, idCliente: 4, asiento0: 10, asiento1: 11 });
  });

  it('listarAsientosOcupados sin cliente cuenta todas las reservas (idCliente 0)', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [] });
    await listarAsientosOcupados(7, [10]);

    const [, binds] = ejecutar.mock.calls[0];
    expect(binds.idCliente).toBe(0);
  });
});
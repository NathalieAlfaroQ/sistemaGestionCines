import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/configuracion/baseDatos.js', () => ({
  ejecutar: vi.fn(),
}));

const { ejecutar } = await import('../../src/configuracion/baseDatos.js');
const {
  MINUTOS_RESERVA,
  RESTRICCION_ASIENTO_RESERVADO,
  bloquearReservaCliente,
  borrarReservaCliente,
  borrarReservasVencidas,
  insertarReserva,
  obtenerReservaCliente,
} = await import('../../src/repositorios/repositorioReservaAsientos.js');

let conexion;

beforeEach(() => {
  conexion = { execute: vi.fn().mockResolvedValue({ rows: [] }), executeMany: vi.fn().mockResolvedValue({}) };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SCRUM-93 repositorioReservaAsientos: constantes', () => {
  it('la reserva dura 5 minutos', () => {
    expect(MINUTOS_RESERVA).toBe(5);
  });

  it('la restricción de asiento reservado es la PK de la tabla', () => {
    expect(RESTRICCION_ASIENTO_RESERVADO).toBe('PK_RESERVAS_ASIENTOS');
  });
});

describe('SCRUM-93 repositorioReservaAsientos: borrados', () => {
  it('borrarReservasVencidas borra solo las vencidas de esos asientos, con la conexión de la transacción', async () => {
    await borrarReservasVencidas(conexion, 3, [10, 11]);

    expect(conexion.execute).toHaveBeenCalledTimes(1);
    const [sql, binds] = conexion.execute.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM RESERVAS_ASIENTOS/);
    expect(sql).toMatch(/ID_PROYECCION = :idProyeccion AND ID_ASIENTO IN \(:asiento0, :asiento1\)/);
    expect(sql).toMatch(/FECHA_EXPIRACION <= SYSDATE/);
    expect(binds).toEqual({ idProyeccion: 3, asiento0: 10, asiento1: 11 });
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('borrarReservaCliente borra solo las filas del cliente', async () => {
    await borrarReservaCliente(conexion, 7);

    const [sql, binds] = conexion.execute.mock.calls[0];
    expect(sql).toMatch(/WHERE ID_CLIENTE = :idCliente/);
    expect(binds).toEqual({ idCliente: 7 });
  });
});

describe('SCRUM-93 repositorioReservaAsientos: insertarReserva', () => {
  it('inserta una fila por asiento con el cliente, la función y los minutos', async () => {
    const detalles = [
      { idAsiento: 10, idTipoBoleto: 1 },
      { idAsiento: 11, idTipoBoleto: 2 },
    ];

    await insertarReserva(conexion, 7, 3, detalles);

    expect(conexion.executeMany).toHaveBeenCalledTimes(1);
    const [sql, filas] = conexion.executeMany.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO RESERVAS_ASIENTOS/);
    expect(sql).toMatch(/SYSDATE \+ :minutos \/ 1440/);
    expect(filas).toEqual([
      { idCliente: 7, idProyeccion: 3, idAsiento: 10, idTipoBoleto: 1, minutos: 5 },
      { idCliente: 7, idProyeccion: 3, idAsiento: 11, idTipoBoleto: 2, minutos: 5 },
    ]);
  });

  it('acepta otra duración en minutos', async () => {
    await insertarReserva(conexion, 7, 3, [{ idAsiento: 10, idTipoBoleto: 1 }], 1);

    const [, filas] = conexion.executeMany.mock.calls[0];
    expect(filas[0].minutos).toBe(1);
  });
});

describe('SCRUM-93 repositorioReservaAsientos: bloquearReservaCliente', () => {
  it('bloquea con FOR UPDATE todas las filas del cliente en esa función e indica si siguen vigentes', async () => {
    conexion.execute.mockResolvedValueOnce({ rows: [[10, 1, 1], [11, 2, 0]] });

    const filas = await bloquearReservaCliente(conexion, 7, 3);

    expect(filas).toEqual([[10, 1, 1], [11, 2, 0]]);
    const [sql, binds] = conexion.execute.mock.calls[0];
    expect(sql).toMatch(/FOR UPDATE/);
    expect(sql).toMatch(/CASE WHEN FECHA_EXPIRACION > SYSDATE THEN 1 ELSE 0 END AS VIGENTE/);
    // No filtra por fecha en el WHERE: las vencidas también se bloquean y se devuelven
    expect(sql.split('WHERE')[1]).not.toMatch(/FECHA_EXPIRACION/);
    expect(binds).toEqual({ idCliente: 7, idProyeccion: 3 });
  });

  it('devuelve [] si el cliente no tiene reserva en esa función', async () => {
    await expect(bloquearReservaCliente(conexion, 7, 3)).resolves.toEqual([]);
  });
});

describe('SCRUM-93 repositorioReservaAsientos: obtenerReservaCliente', () => {
  it('devuelve las filas vigentes con los segundos restantes', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [[3, 10, 1, 287], [3, 11, 2, 287]] });

    const filas = await obtenerReservaCliente(7);

    expect(filas).toEqual([[3, 10, 1, 287], [3, 11, 2, 287]]);
    const [sql, binds] = ejecutar.mock.calls[0];
    expect(sql).toMatch(/\* 86400/);
    expect(sql).toMatch(/FECHA_EXPIRACION > SYSDATE/);
    expect(binds).toEqual({ idCliente: 7 });
  });

  it('devuelve [] si el cliente no tiene reserva vigente', async () => {
    ejecutar.mockResolvedValueOnce({ rows: [] });

    await expect(obtenerReservaCliente(7)).resolves.toEqual([]);
  });
});

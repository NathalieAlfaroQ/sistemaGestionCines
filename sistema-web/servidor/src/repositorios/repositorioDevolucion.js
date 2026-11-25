import oracledb from 'oracledb';

// Errores propios que lanzan los procedimientos (RAISE_APPLICATION_ERROR). node-oracledb los
// entrega con errorNum igual al número sin el signo (ORA-20020 -> 20020).
export const ERRORES_DEVOLUCION = {
  compraNoExiste: 20020,
  compraYaCancelada: 20021,
  fueraDePlazo: 20022,
  sinPagoRegistrado: 20023,
  sinDevolucionPorConfirmar: 20024,
};

// Tamaños de las columnas que llenan los parámetros de salida
const LARGO_ID_PAGO = 100; // FACTURAS_FINALES.ID_INTENCION_PAGO
const LARGO_METODO = 20; // METODOS_PAGO.NOMBRE_METODO

const sqlSolicitarDevolucion = `
  BEGIN
    PR_SOLICITAR_DEVOLUCION(:idFactura, :idCliente, :monto, :idPago, :metodo);
  END;
`;

// Bloquea la factura del cliente, valida el plazo, marca sus boletos como DEVUELTO y registra la devolución.
// Devuelve lo necesario para reembolsar: { monto, idPago, metodo } ('Tarjeta' o 'PayPal').
export async function solicitarDevolucion(conexion, idFactura, idCliente) {
  const resultado = await conexion.execute(sqlSolicitarDevolucion, {
    idFactura,
    idCliente,
    monto: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    idPago: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: LARGO_ID_PAGO },
    metodo: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: LARGO_METODO },
  });
  const { monto, idPago, metodo } = resultado.outBinds;
  return { monto, idPago, metodo };
}

const sqlConfirmarDevolucion = `
  BEGIN
    PR_CONFIRMAR_DEVOLUCION(:idFactura, :idReembolso);
  END;
`;

// Guarda el id del reembolso que dio la pasarela. Puede ser null si la pasarela no lo informa.
export async function confirmarDevolucion(conexion, idFactura, idReembolso) {
  await conexion.execute(sqlConfirmarDevolucion, {
    idFactura,
    // Con el tipo explícito, un null también se envía bien
    idReembolso: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: idReembolso ?? null },
  });
}

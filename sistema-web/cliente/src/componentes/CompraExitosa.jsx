import { useState } from 'react';
import { descargarBoletos } from '../servicios/servicioCompra.js';
import { formatearColones } from '../utilidades/moneda.js';
import Modal from '../common/Modal.jsx';

function CompraExitosa({ compra, correo, guardoTarjeta, alVolver }) {
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(null);

  async function descargar() {
    setErrorDescarga(null);
    setDescargando(true);
    try {
      await descargarBoletos(compra.idFactura);
    } catch (error) {
      setErrorDescarga(error.message);
    } finally {
      setDescargando(false);
    }
  }

  const mensaje = compra.correoEnviado ? (
    <>
      Te enviamos tus boletos a <strong>{correo}</strong>. Presenta el código QR de cada boleto en la entrada de la
      sala.
    </>
  ) : (
    'Tu compra se realizó con éxito, pero no pudimos enviarte el correo. Descarga tus boletos aquí.'
  );

  return (
    <Modal
      titulo="¡Compra exitosa!"
      mensaje={mensaje}
      botones={[
        {
          texto: descargando ? 'Descargando...' : 'Descargar boletos',
          enfocar: !compra.correoEnviado,
          deshabilitado: descargando,
          alPulsar: descargar,
        },
        { texto: 'Volver al inicio', variante: 'secundario', enfocar: compra.correoEnviado, alPulsar: alVolver },
      ]}
    >
      <p className="text-sm">
        Factura N.º {compra.idFactura} · Total {formatearColones(compra.total)}
      </p>

      {compra.metodoGuardado && <p className="mt-2 text-sm">Guardamos tu tarjeta para tus próximas compras.</p>}
      {guardoTarjeta && !compra.metodoGuardado && (
        <p className="mt-2 text-sm">No pudimos guardar tu tarjeta; puedes guardarla en tu próxima compra.</p>
      )}

      {errorDescarga && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {errorDescarga}
        </p>
      )}
    </Modal>
  );
}

export default CompraExitosa;
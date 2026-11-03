import { useState } from 'react';
import { Link } from 'react-router-dom';
import { descargarBoletos } from '../servicios/servicioCompra.js';
import { formatearColones } from '../utilidades/moneda.js';
import Boton, { clasesBoton } from '../common/Boton.jsx';

// Pantalla después de pagar. Si el correo no se pudo enviar, la compra igual es válida:
// se avisa y el botón de descarga queda como acción principal.
function CompraExitosa({ compra, correo, guardoTarjeta }) {
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

  return (
    <section
      aria-live="polite"
      className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-lg border border-border bg-surface px-8 py-10 text-center text-text-color"
    >
      <h1 className="text-2xl font-bold text-success">¡Compra exitosa!</h1>

      <p>
        Factura N.º {compra.idFactura} · Total {formatearColones(compra.total)}
      </p>

      {compra.correoEnviado ? (
        <p>
          Te enviamos tus boletos a <strong>{correo}</strong>. Presenta el código QR de cada boleto en la entrada de
          la sala.
        </p>
      ) : (
        <p role="alert" className="rounded-md border border-warning px-4 py-3 text-warning">
          Tu compra se realizó con éxito, pero no pudimos enviarte el correo. Descarga tus boletos aquí.
        </p>
      )}

      {guardoTarjeta && !compra.metodoGuardado && (
        <p className="text-sm text-text-muted">No pudimos guardar tu tarjeta; puedes guardarla en tu próxima compra.</p>
      )}
      {compra.metodoGuardado && <p className="text-sm">Guardamos tu tarjeta para tus próximas compras.</p>}

      <div className="flex flex-wrap justify-center gap-3">
        <Boton variante={compra.correoEnviado ? 'secundario' : 'principal'} onClick={descargar} disabled={descargando}>
          {descargando ? 'Descargando...' : 'Descargar boletos'}
        </Boton>
        <Link to="/" className={clasesBoton({ variante: 'contorno' })}>
          Volver al inicio
        </Link>
      </div>

      {errorDescarga && (
        <p role="alert" className="text-sm text-danger">
          {errorDescarga}
        </p>
      )}
    </section>
  );
}

export default CompraExitosa;

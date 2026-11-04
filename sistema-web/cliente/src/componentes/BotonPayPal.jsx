import { useRef } from 'react';
import { FUNDING, PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { MENSAJE_PAYPAL_NO_COMPLETADO, capturarOrdenPayPal, crearOrdenPayPal } from '../servicios/servicioCompra.js';
import { TIPOS_ERROR, crearError } from '../servicios/servicioReserva.js';

// El Client ID de PayPal es público (va en el navegador); el secreto solo lo tiene el servidor
const OPCIONES_PAYPAL = {
  clientId: import.meta.env.VITE_PAYPAL_ID_CLIENTE,
  currency: 'USD', // PayPal no acepta colones: el servidor convierte el total a dólares
  intent: 'capture',
};

export const MENSAJE_REDIRECCION_PAYPAL = 'Serás redirigido a una página segura para completar tu compra.';

const ESTILO_BOTON = { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 44 };

// Botón de PayPal. El SDK abre su propia ventana y llama a estas funciones:
// - createOrder: al presionar el botón -> el servidor crea la orden
// - onApprove: el cliente aprobó -> el servidor verifica y captura (aquí se cobra)
// - onCancel: el cliente cerró la ventana o canceló
// - onError: cualquier otro fallo (incluido un error de createOrder)
// seleccion = { idProyeccion, asientos, boletos }
function BotonPayPal({ seleccion, deshabilitado, alEmpezarCaptura, alTerminar, alFallar }) {
  // createOrder no puede pasarle su error a onError (PayPal lo reemplaza por uno genérico):
  // se guarda aquí para saber, por ejemplo, si fue un asiento ya vendido (409)
  const errorAlCrear = useRef(null);

  async function crearOrden() {
    errorAlCrear.current = null;
    try {
      const { idOrden } = await crearOrdenPayPal(seleccion);
      return idOrden;
    } catch (error) {
      errorAlCrear.current = error;
      throw error;
    }
  }

  async function aprobar({ orderID }) {
    alEmpezarCaptura();
    try {
      alTerminar(await capturarOrdenPayPal(orderID, seleccion));
    } catch (error) {
      alFallar(error);
    }
  }

  function cancelar() {
    alFallar(crearError(MENSAJE_PAYPAL_NO_COMPLETADO, TIPOS_ERROR.rechazado));
  }

  function fallar() {
    const error = errorAlCrear.current;
    alFallar(
      error?.tipo === TIPOS_ERROR.conflicto ? error : crearError(MENSAJE_PAYPAL_NO_COMPLETADO, TIPOS_ERROR.rechazado)
    );
  }

  if (!OPCIONES_PAYPAL.clientId) {
    console.error('Falta VITE_PAYPAL_ID_CLIENTE en el .env del cliente');
    return null;
  }

  return (
    <PayPalScriptProvider options={OPCIONES_PAYPAL}>
      {/* Justo encima del botón, para que se lea antes de salir a la ventana de PayPal */}
      <p role="status" className="mb-3 rounded-md border border-brand-soft px-4 py-3 text-sm text-brand-soft">
        {MENSAJE_REDIRECCION_PAYPAL}
      </p>
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
        style={ESTILO_BOTON}
        disabled={deshabilitado}
        createOrder={crearOrden}
        onApprove={aprobar}
        onCancel={cancelar}
        onError={fallar}
      />
    </PayPalScriptProvider>
  );
}

export default BotonPayPal;

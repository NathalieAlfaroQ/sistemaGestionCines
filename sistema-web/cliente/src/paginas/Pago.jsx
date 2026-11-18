import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'flowbite-react';
import { terminarCompraEnCurso, useCompraEnCurso } from '../ganchos/useCompraEnCurso.js';
import { useConsulta } from '../ganchos/useConsulta.js';
import { formatearTiempo, useCuentaRegresiva } from '../ganchos/useCuentaRegresiva.js';
import { useFormularioTarjeta } from '../ganchos/useFormularioTarjeta.js';
import { useMapaAsientos } from '../ganchos/useMapaAsientos.js';
import { usePeliculaCartelera } from '../ganchos/usePeliculaCartelera.js';
import { POS_PROYECCION } from '../constantes/posicionesReserva.js';
import { comprar, obtenerMetodoPagoGuardado, registrarTarjeta } from '../servicios/servicioCompra.js';
import { TIPOS_ERROR, cancelarReserva, obtenerMiReserva } from '../servicios/servicioReserva.js';
import { obtenerUsuario } from '../servicios/sesion.js';
import { datosTarjeta } from '../validaciones/validacionesTarjeta.js';
import { temaFormulario } from '../temas/temaFormulario.js';
import BotonPayPal from '../componentes/BotonPayPal.jsx';
import EncabezadoPelicula from '../componentes/EncabezadoPelicula.jsx';
import ResumenCompra from '../componentes/ResumenCompra.jsx';
import FormularioPago, { METODOS } from '../componentes/FormularioPago.jsx';
import CompraExitosa from '../componentes/CompraExitosa.jsx';
import ContenedorCliente from '../componentes/ContenedorCliente.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';
import BotonVolver from '../componentes/BotonVolver.jsx';
import Boton from '../common/Boton.jsx';
import Modal from '../common/Modal.jsx';

const ID_FORMULARIO = 'formulario-pago';
const MENSAJE_PROCESANDO = 'Procesando pago, por favor no recargues ni cierres esta página.';
const MENSAJE_TIEMPO_AGOTADO =
  'Tu tiempo para pagar terminó y los asientos se liberaron. Vuelve a elegir tus asientos.';
// Desde aquí la cuenta regresiva se muestra como advertencia
const SEGUNDOS_ADVERTENCIA = 60;

// Tiempo que le queda al cliente para pagar, según su reserva en el servidor
function CuentaRegresiva({ segundos }) {
  const urgente = segundos <= SEGUNDOS_ADVERTENCIA;
  return (
    <p
      role="timer"
      aria-live="off"
      className={`rounded-md border px-4 py-3 text-sm ${urgente ? 'border-warning text-warning' : 'border-brand-soft text-brand-soft'}`}
    >
      Tus asientos están reservados. Tiempo para completar el pago:{' '}
      <span className="font-bold tabular-nums">{formatearTiempo(segundos)}</span>
    </p>
  );
}

// Mientras se procesa el pago, el navegador pide confirmación antes de cerrar o recargar
function useAvisoAlSalir(activo) {
  useEffect(() => {
    if (!activo) return undefined;

    function avisar(evento) {
      evento.preventDefault();
      evento.returnValue = '';
    }
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [activo]);
}

// Formulario de pago de una compra en curso
// compraHecha: resultado de la compra cuando ya terminó; el modal de éxito se abre sobre esta pantalla
function PantallaPago({ compraEnCurso, usuario, compraHecha, alTerminar, alVolver }) {
  const navegar = useNavigate();

  const idProyeccion = compraEnCurso.idProyeccion;
  const mapa = useMapaAsientos(idProyeccion);
  const pelicula = usePeliculaCartelera(mapa.proyeccion?.[POS_PROYECCION.idPelicula]);
  const consultarGuardado = useCallback(() => obtenerMetodoPagoGuardado(), []);
  const { datos: metodoGuardado } = useConsulta(consultarGuardado);

  // El tiempo restante lo da el servidor (también si el cliente recarga la página)
  const consultarReserva = useCallback(() => obtenerMiReserva(), []);
  const { datos: reserva, cargando: cargandoReserva, error: errorReserva, recargar: recargarReserva } =
    useConsulta(consultarReserva);
  const reservaValida = reserva?.idProyeccion === idProyeccion;
  const segundosRestantes = useCuentaRegresiva(reservaValida ? reserva.segundosRestantes : null);

  const tarjeta = useFormularioTarjeta();
  const [metodoElegido, setMetodo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState(null);
  const [reservaPerdida, setReservaPerdida] = useState(null);
  const enviando = useRef(false);
  const refAvisos = useRef(null);

  useAvisoAlSalir(procesando);

  // Se acabó el tiempo (o ya no había reserva). Mientras se procesa un pago no se interrumpe:
  // el servidor decide, y si la reserva venció responde con un error que abre el mismo modal.
  const sinReserva = !cargandoReserva && !errorReserva && !reservaValida;
  const tiempoAgotado = !compraHecha && !procesando && (sinReserva || segundosRestantes === 0);

  // El botón de pagar queda abajo: se trae a la vista la alerta de "procesando" o del rechazo
  useEffect(() => {
    if (procesando || errorPago) refAvisos.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [procesando, errorPago]);

  // Si tiene una tarjeta guardada vigente, se ofrece primero
  const metodo =
    metodoElegido ?? (metodoGuardado && !metodoGuardado.vencida ? METODOS.tarjetaGuardada : METODOS.tarjetaNueva);

  // Los asientos y boletos los toma el servidor de la reserva: solo se manda la función
  const datosCompra = { idProyeccion };

  // Vuelve al mapa de asientos de esta función y libera la reserva
  function elegirOtrosAsientos() {
    terminarCompraEnCurso();
    void cancelarReserva();
    void navegar(`/funciones/${idProyeccion}/asientos`, { replace: true });
  }

  // La reserva venció o un asiento ya no está disponible: modal para elegir otros.
  // Cualquier otro error: aviso arriba.
  function mostrarError(error) {
    if (error.tipo === TIPOS_ERROR.conflicto) {
      setReservaPerdida(error.message);
    } else {
      setErrorPago(error);
    }
  }

  async function pagar(evento) {
    evento.preventDefault();
    // Con PayPal se paga con su propio botón; Enter en el formulario no debe hacer nada
    if (metodo === METODOS.paypal) return;
    // El botón se deshabilita, pero un doble clic muy rápido puede llegar antes del re-render
    if (enviando.current) return;
    if (metodo === METODOS.tarjetaNueva && !tarjeta.validarAlEnviar()) return;

    enviando.current = true;
    setErrorPago(null);
    setProcesando(true);

    try {
      const datosMetodo =
        metodo === METODOS.tarjetaGuardada
          ? { usarTarjetaGuardada: true }
          : {
              idMetodoPago: await registrarTarjeta(datosTarjeta(tarjeta.formulario)),
              guardarMetodo: tarjeta.guardarTarjeta,
            };

      const resultado = await comprar({ ...datosCompra, ...datosMetodo });
      alTerminar(resultado, metodo === METODOS.tarjetaNueva && tarjeta.guardarTarjeta);
    } catch (error) {
      mostrarError(error);
    } finally {
      enviando.current = false;
      setProcesando(false);
    }
  }

  if (!mapa.proyeccion) {
    return (
      <main className="min-h-screen bg-background py-12 text-text-color">
        <ContenedorCliente>
          {mapa.error ? <ErrorCarga error={mapa.error} alReintentar={mapa.recargar} /> : <p>Cargando compra...</p>}
        </ContenedorCliente>
      </main>
    );
  }

  return (
    <ThemeProvider theme={temaFormulario}>
      <main className="min-h-screen bg-background">
        {pelicula.detalle && <EncabezadoPelicula detalle={pelicula.detalle} />}

        <ContenedorCliente className="py-10 flex flex-col gap-6">
          {!compraHecha && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BotonVolver alVolver={elegirOtrosAsientos} />
              {reservaValida && segundosRestantes !== null && <CuentaRegresiva segundos={segundosRestantes} />}
            </div>
          )}

          <div ref={refAvisos} className="flex flex-col gap-4 empty:hidden">
            {errorReserva && <ErrorCarga error={errorReserva} alReintentar={recargarReserva} />}
            {procesando && (
              <p role="alert" className="rounded-md border border-warning px-4 py-3 text-warning">
                {MENSAJE_PROCESANDO}
              </p>
            )}
            {errorPago && <ErrorCarga error={errorPago} />}
          </div>

          <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:items-start">
            <ResumenCompra
              proyeccion={mapa.proyeccion}
              etiquetas={compraEnCurso.etiquetas ?? []}
              boletos={compraEnCurso.boletos}
              tiposBoleto={mapa.tiposBoleto}
            >
              {metodo === METODOS.paypal ? (
                <BotonPayPal
                  seleccion={datosCompra}
                  deshabilitado={procesando}
                  alEmpezarCaptura={() => {
                    setErrorPago(null);
                    setProcesando(true);
                  }}
                  alTerminar={(resultado) => alTerminar(resultado, false)}
                  alFallar={(error) => {
                    setProcesando(false);
                    mostrarError(error);
                  }}
                />
              ) : (
                <Boton type="submit" form={ID_FORMULARIO} disabled={procesando} className="w-full">
                  {procesando ? 'Procesando pago...' : 'Completar pago'}
                </Boton>
              )}
            </ResumenCompra>

            <FormularioPago
              id={ID_FORMULARIO}
              usuario={usuario}
              metodoGuardado={metodoGuardado}
              metodo={metodo}
              setMetodo={setMetodo}
              tarjeta={tarjeta}
              deshabilitado={procesando}
              alEnviar={pagar}
            />
          </div>
        </ContenedorCliente>

        {compraHecha && (
          <CompraExitosa
            compra={compraHecha}
            correo={usuario?.correo}
            guardoTarjeta={compraHecha.pidioGuardarTarjeta}
            alVolver={alVolver}
          />
        )}

        {(reservaPerdida || tiempoAgotado) && (
          <Modal
            titulo="Tu reserva ya no está disponible"
            mensaje={reservaPerdida ?? MENSAJE_TIEMPO_AGOTADO}
            alCerrar={elegirOtrosAsientos}
            botones={[{ texto: 'Elegir asientos otra vez', enfocar: true, alPulsar: elegirOtrosAsientos }]}
          />
        )}
      </main>
    </ThemeProvider>
  );
}

function Pago() {
  const navegar = useNavigate();
  const compraEnCurso = useCompraEnCurso();
  const usuario = obtenerUsuario();
  const [terminada, setTerminada] = useState(null);

  function terminar(resultado, pidioGuardarTarjeta) {
    setTerminada({ compraEnCurso, resultado: { ...resultado, pidioGuardarTarjeta } });
    terminarCompraEnCurso();
    // Borra la selección del historial: si se recarga la página no debe volver a ofrecer pagarla
    void navegar('/pago', { replace: true, state: null });
  }

  const compra = terminada?.compraEnCurso ?? compraEnCurso;

  if (!compra) {
    return <Navigate to="/" replace />;
  }

  return (
    <PantallaPago
      compraEnCurso={compra}
      usuario={usuario}
      compraHecha={terminada?.resultado ?? null}
      alTerminar={terminar}
      alVolver={() => void navegar('/', { replace: true })}
    />
  );
}

export default Pago;
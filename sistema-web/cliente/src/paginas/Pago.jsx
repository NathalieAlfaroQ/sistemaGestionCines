import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'flowbite-react';
import { terminarCompraEnCurso, useCompraEnCurso } from '../ganchos/useCompraEnCurso.js';
import { useConsulta } from '../ganchos/useConsulta.js';
import { useFormularioTarjeta } from '../ganchos/useFormularioTarjeta.js';
import { useMapaAsientos } from '../ganchos/useMapaAsientos.js';
import { usePeliculaCartelera } from '../ganchos/usePeliculaCartelera.js';
import { POS_PROYECCION } from '../constantes/posicionesReserva.js';
import { comprar, obtenerMetodoPagoGuardado, registrarTarjeta } from '../servicios/servicioCompra.js';
import { TIPOS_ERROR } from '../servicios/servicioReserva.js';
import { obtenerUsuario } from '../servicios/sesion.js';
import { datosTarjeta } from '../validaciones/validacionesTarjeta.js';
import { temaFormulario } from '../temas/temaFormulario.js';
import EncabezadoPelicula from '../componentes/EncabezadoPelicula.jsx';
import ResumenCompra from '../componentes/ResumenCompra.jsx';
import FormularioPago, { METODOS } from '../componentes/FormularioPago.jsx';
import CompraExitosa from '../componentes/CompraExitosa.jsx';
import ContenedorCliente from '../componentes/ContenedorCliente.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';
import Boton from '../common/Boton.jsx';
import Modal from '../common/Modal.jsx';

const ID_FORMULARIO = 'formulario-pago';
const MENSAJE_PROCESANDO = 'Procesando pago, por favor no recargues ni cierres esta página.';

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
function PantallaPago({ compraEnCurso, usuario, alTerminar }) {
  const navegar = useNavigate();

  const idProyeccion = compraEnCurso.idProyeccion;
  const mapa = useMapaAsientos(idProyeccion);
  const pelicula = usePeliculaCartelera(mapa.proyeccion?.[POS_PROYECCION.idPelicula]);
  const consultarGuardado = useCallback(() => obtenerMetodoPagoGuardado(), []);
  const { datos: metodoGuardado } = useConsulta(consultarGuardado);

  const tarjeta = useFormularioTarjeta();
  const [metodoElegido, setMetodo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState(null);
  const [asientoTomado, setAsientoTomado] = useState(null);
  const enviando = useRef(false);
  const refAvisos = useRef(null);

  useAvisoAlSalir(procesando);

  // El botón de pagar queda abajo: se trae a la vista la alerta de "procesando" o del rechazo
  useEffect(() => {
    if (procesando || errorPago) refAvisos.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [procesando, errorPago]);

  // Si tiene una tarjeta guardada vigente, se ofrece primero
  const metodo = metodoElegido ?? (metodoGuardado && !metodoGuardado.vencida ? METODOS.tarjetaGuardada : METODOS.tarjetaNueva);

  async function pagar(evento) {
    evento.preventDefault();
    // El botón se deshabilita, pero un doble clic muy rápido puede llegar antes del re-render
    if (enviando.current) return;
    if (metodo === METODOS.tarjetaNueva && !tarjeta.validarAlEnviar()) return;

    enviando.current = true;
    setErrorPago(null);
    setProcesando(true);

    try {
      const seleccion = { idProyeccion, asientos: compraEnCurso.asientos, boletos: compraEnCurso.boletos };
      const datosMetodo =
        metodo === METODOS.tarjetaGuardada
          ? { usarTarjetaGuardada: true }
          : {
              idMetodoPago: await registrarTarjeta(datosTarjeta(tarjeta.formulario)),
              guardarMetodo: tarjeta.guardarTarjeta,
            };

      const resultado = await comprar({ ...seleccion, ...datosMetodo });
      alTerminar(resultado, metodo === METODOS.tarjetaNueva && tarjeta.guardarTarjeta);
    } catch (error) {
      if (error.tipo === TIPOS_ERROR.conflicto) {
        setAsientoTomado(error.message);
      } else {
        setErrorPago(error);
      }
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
          <div ref={refAvisos} className="flex flex-col gap-4 empty:hidden">
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
              <Boton type="submit" form={ID_FORMULARIO} disabled={procesando} className="w-full">
                {procesando ? 'Procesando pago...' : 'Completar pago'}
              </Boton>
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

        {asientoTomado && (
          <Modal
            titulo="Asiento no disponible"
            mensaje={asientoTomado}
            alCerrar={() => setAsientoTomado(null)}
            botones={[
              {
                texto: 'Elegir otros asientos',
                enfocar: true,
                alPulsar: () => void navegar(`/funciones/${idProyeccion}/asientos`, { replace: true }),
              },
            ]}
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
  const [compraHecha, setCompraHecha] = useState(null);

  function terminar(resultado, pidioGuardarTarjeta) {
    terminarCompraEnCurso();
    setCompraHecha({ ...resultado, pidioGuardarTarjeta });
    window.scrollTo({ top: 0 });
    // Borra la selección del historial: si se recarga la página no debe volver a ofrecer pagarla
    void navegar('/pago', { replace: true, state: null });
  }

  if (compraHecha) {
    return (
      <main className="min-h-screen bg-background py-12">
        <ContenedorCliente>
          <CompraExitosa
            compra={compraHecha}
            correo={usuario?.correo}
            guardoTarjeta={compraHecha.pidioGuardarTarjeta}
          />
        </ContenedorCliente>
      </main>
    );
  }

  // Sin selección no hay nada que pagar (se entró directo a /pago o la compra ya terminó)
  if (!compraEnCurso) {
    return <Navigate to="/" replace />;
  }

  return <PantallaPago compraEnCurso={compraEnCurso} usuario={usuario} alTerminar={terminar} />;
}

export default Pago;

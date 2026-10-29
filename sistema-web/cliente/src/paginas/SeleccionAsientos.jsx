import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMapaAsientos } from '../ganchos/useMapaAsientos.js';
import { usePeliculaCartelera } from '../ganchos/usePeliculaCartelera.js';
import { useSeleccionAsientos } from '../ganchos/useSeleccionAsientos.js';
import { useVolver } from '../ganchos/useVolver.js';
import { POS_PROYECCION } from '../constantes/posicionesReserva.js';
import { TIPOS_ERROR, verificarSeleccion } from '../servicios/servicioReserva.js';
import { obtenerToken } from '../servicios/sesion.js';
import { formatearFechaFuncion } from '../utilidades/fechas.js';
import EncabezadoPelicula from '../componentes/EncabezadoPelicula.jsx';
import MapaAsientos from '../componentes/MapaAsientos.jsx';
import PanelBoletos from '../componentes/PanelBoletos.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';
import ContenedorCliente from '../componentes/ContenedorCliente.jsx';
import Modal from '../common/Modal.jsx';

function SeleccionAsientos() {
  const { idProyeccion } = useParams();
  const navegar = useNavigate();

  const mapa = useMapaAsientos(idProyeccion);
  const idPelicula = mapa.proyeccion?.[POS_PROYECCION.idPelicula];
  const pelicula = usePeliculaCartelera(idPelicula);
  const seleccion = useSeleccionAsientos(mapa.asientos, mapa.tiposBoleto);
  const volver = useVolver(idPelicula ? `/cartelera/${idPelicula}` : '/');

  const [verificando, setVerificando] = useState(false);
  const [errorVerificacion, setErrorVerificacion] = useState(null);
  const [pedirSesion, setPedirSesion] = useState(false);

  async function continuar() {
    setErrorVerificacion(null);

    const aviso = seleccion.validarParaContinuar();
    if (aviso) {
      seleccion.setAviso(aviso);
      return;
    }
    if (!obtenerToken()) {
      setPedirSesion(true);
      return;
    }

    setVerificando(true);
    const datos = seleccion.datosVerificacion();
    try {
      const { total } = await verificarSeleccion(idProyeccion, datos);
      // La pantalla de pago (otra historia) recibe la selección por el estado de la navegación
      void navegar('/pago', {
        state: { idProyeccion: Number(idProyeccion), ...datos, etiquetas: seleccion.etiquetasSeleccionados, total },
      });
    } catch (error) {
      if (error.tipo === TIPOS_ERROR.conflicto) {
        // Otro usuario compró algún asiento: se muestra el mensaje y se recarga el mapa.
        // Los asientos vendidos salen solos de la selección (ver useSeleccionAsientos).
        seleccion.setAviso(error.message);
        mapa.recargar();
      } else {
        setErrorVerificacion(error);
      }
    } finally {
      setVerificando(false);
    }
  }

  // Sin datos de la función no hay pantalla: se muestra la carga o el error
  if (!mapa.proyeccion) {
    return (
      <main className="min-h-screen bg-background py-12 text-text-color">
        <ContenedorCliente>
          {mapa.error ? <ErrorCarga error={mapa.error} alReintentar={mapa.recargar} /> : <p>Cargando función...</p>}
        </ContenedorCliente>
      </main>
    );
  }

  const proyeccion = mapa.proyeccion;
  const detallesFuncion = [
    proyeccion[POS_PROYECCION.sede],
    proyeccion[POS_PROYECCION.sala],
    proyeccion[POS_PROYECCION.formato],
    formatearFechaFuncion(proyeccion[POS_PROYECCION.fecha]),
  ].join(' · ');

  return (
    <main className="min-h-screen bg-background">
      {pelicula.detalle && <EncabezadoPelicula detalle={pelicula.detalle} />}

      <ContenedorCliente className="py-10 flex flex-col gap-6">
        {pelicula.error && <ErrorCarga error={pelicula.error} alReintentar={pelicula.recargar} />}
        {mapa.error && <ErrorCarga error={mapa.error} alReintentar={mapa.recargar} />}
        {errorVerificacion && <ErrorCarga error={errorVerificacion} alReintentar={continuar} />}

        <p className="text-sm text-white/70">{detallesFuncion}</p>

        <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:items-start">
          <MapaAsientos
            asientos={mapa.asientos}
            estaSeleccionado={seleccion.estaSeleccionado}
            alAlternar={seleccion.alternarAsiento}
            etiquetasSeleccionados={seleccion.etiquetasSeleccionados}
          />

          <PanelBoletos
            seleccion={seleccion}
            tiposBoleto={mapa.tiposBoleto}
            aviso={seleccion.aviso}
            verificando={verificando}
            alCancelar={volver}
            alContinuar={continuar}
          />
        </div>
      </ContenedorCliente>

      {pedirSesion && (
        <Modal
          titulo="Inicia sesión"
          mensaje="Para continuar con la compra necesitas iniciar sesión."
          alCerrar={() => setPedirSesion(false)}
          botones={[
            { texto: 'Iniciar sesión', enfocar: true, alPulsar: () => void navegar('/iniciar-sesion') },
            { texto: 'Cerrar', variante: 'secundario', alPulsar: () => setPedirSesion(false) },
          ]}
        />
      )}
    </main>
  );
}

export default SeleccionAsientos;
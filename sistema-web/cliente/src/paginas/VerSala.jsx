import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSala } from '../ganchos/useSala.js';
import { POS_DETALLE_SALA as POS } from '../constantes/posicionesSala.js';
import { generarAsientos } from '../utilidades/asientos.js';
import { formatearColones } from '../utilidades/formatearColones.js';
import CampoSoloLectura from '../componentes/CampoSoloLectura.jsx';
import MapaAsientos from '../componentes/MapaAsientos.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';

const claseBotonVolver = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover';

function VerSala() {
  const navegar = useNavigate();
  const { id } = useParams();
  const { sala, cargando, error, recargar } = useSala(id);

  const filas = sala?.[POS.filas];
  const columnas = sala?.[POS.columnas];
  const asientos = useMemo(
    () => (filas && columnas ? generarAsientos(filas, columnas) : []),
    [filas, columnas],
  );

  const volverALista = () => navegar('/salas');

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-8 text-4xl font-bold">Ver sala</h1>

        {cargando && <p className="text-text-muted">Cargando sala...</p>}
        <ErrorCarga error={error} alReintentar={recargar} className="mb-6" />

        {sala && (
          <div className="flex flex-col gap-10">
            <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
              <div className="flex flex-col gap-6">
                <CampoSoloLectura id="nombre" etiqueta="Nombre" valor={sala[POS.nombre]} />
                <CampoSoloLectura id="tipo" etiqueta="Tipo" valor={sala[POS.tipo]} />
                <CampoSoloLectura id="formato" etiqueta="Formato" valor={sala[POS.formato]} />
                <CampoSoloLectura id="precio" etiqueta="Precio" valor={formatearColones(sala[POS.monto])} />
              </div>

              <div className="flex flex-col gap-6">
                <CampoSoloLectura id="sede" etiqueta="Cine" valor={sala[POS.cine]} />
                <CampoSoloLectura id="distribucion" etiqueta="Distribución" valor={sala[POS.distribucion]} />

                <div className="grid grid-cols-3 gap-4">
                  <CampoSoloLectura id="filas" etiqueta="Filas" valor={filas} />
                  <CampoSoloLectura id="columnas" etiqueta="Columnas" valor={columnas} />
                  <CampoSoloLectura id="total" etiqueta="Total de asientos" valor={sala[POS.total]} />
                </div>
              </div>
            </div>

            <section aria-label="Distribución de la sala" className="rounded-lg border border-border bg-surface px-6 py-8">
              <MapaAsientos asientos={asientos} soloVista />
            </section>
          </div>
        )}

        <div className="mt-10">
          <button type="button" onClick={volverALista} className={claseBotonVolver}>
            Volver
          </button>
        </div>
      </div>
    </main>
  );
}

export default VerSala;

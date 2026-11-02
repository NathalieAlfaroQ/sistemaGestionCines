import { useMemo } from 'react';
import { useSedes } from '../ganchos/useSedes.js';
import { useCatalogoSala } from '../ganchos/useCatalogoSala.js';
import { useFormularioSala } from '../ganchos/useFormularioSala.js';
import { POS_CATALOGO_SALA, POS_DISTRIBUCION } from '../constantes/posicionesSala.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import { generarAsientos } from '../utilidades/asientos.js';
import { normalizarNombre, NOMBRE_MAXIMO } from '../validaciones/validacionesSala.js';
import MapaAsientos from './MapaAsientos.jsx';
import MensajeError from '../common/MensajeError.jsx';

const claseEtiqueta = 'mb-2 block text-sm text-text-color';
const claseCampo = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft disabled:opacity-50';
const claseDesplegable = claseCampo;
const claseSoloLectura = 'flex min-h-[2.625rem] items-center rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-text-muted';
const claseBotonConfirmar = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover disabled:opacity-50';
const claseBotonCancelar = 'flex items-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-soft-hover disabled:opacity-50';

// Sin decimales si el precio es entero (₡3 000); con dos si no lo es (₡3 000,50)
function formatearColones(monto) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: Number.isInteger(monto) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(monto);
}

function Asterisco() {
  return <span className="text-danger">*</span>;
}

// Dato que se muestra pero no se escribe, usado en el precio y la cantidad de asientos
function CampoSoloLectura({ id, etiqueta, valor }) {
  return (
    <div>
      <label htmlFor={id} className={claseEtiqueta}>
        {etiqueta}
      </label>
      <output id={id} className={claseSoloLectura}>
        {valor ?? '—'}
      </output>
    </div>
  );
}

function buscarPorId(lista, id) {
  return lista.find((fila) => String(fila[POS_CATALOGO_SALA.id]) === id);
}

function FormularioSala({
  valorInicial,
  textoGuardar = 'Guardar',
  alEnviar,
  alCancelar,
  guardando = false,
  error = null,
}) {
  const { sedes, error: errorSedes } = useSedes({ estado: 'activas' });
  const { tipos, formatos, distribuciones, error: errorCatalogo } = useCatalogoSala();

  const {
    formulario,
    hayCamposVacios,
    errorVisible,
    enlazar,
    validarAlEnviar,
  } = useFormularioSala({
    nombre: valorInicial?.nombre ?? '',
    idSede: String(valorInicial?.idSede ?? ''),
    idTipo: String(valorInicial?.idTipo ?? ''),
    idFormato: String(valorInicial?.idFormato ?? ''),
    idDistribucion: String(valorInicial?.idDistribucion ?? ''),
  });

  const errorNombre = errorVisible('nombre');
  const errorSede = errorVisible('idSede');
  const errorTipo = errorVisible('idTipo');
  const errorFormato = errorVisible('idFormato');
  const errorDistribucion = errorVisible('idDistribucion');

  const tipo = buscarPorId(tipos, formulario.idTipo);
  const formato = buscarPorId(formatos, formulario.idFormato);
  const precio = tipo && formato ? tipo[POS_CATALOGO_SALA.precio] + formato[POS_CATALOGO_SALA.precio] : null;

  const distribucion = buscarPorId(distribuciones, formulario.idDistribucion);
  const filas = distribucion?.[POS_DISTRIBUCION.filas];
  const columnas = distribucion?.[POS_DISTRIBUCION.columnas];
  const asientos = useMemo(
    () => (filas && columnas ? generarAsientos(filas, columnas) : []),
    [filas, columnas],
  );

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarAlEnviar()) return;

    alEnviar({
      nombre: normalizarNombre(formulario.nombre),
      idSede: Number(formulario.idSede),
      idTipo: Number(formulario.idTipo),
      idFormato: Number(formulario.idFormato),
      idDistribucion: Number(formulario.idDistribucion),
    });
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="flex flex-col gap-10">
      {(errorSedes || errorCatalogo) && <p className="text-warning">{errorSedes || errorCatalogo}</p>}

      <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="nombre" className={claseEtiqueta}>
              Nombre <Asterisco />
            </label>
            <input
              id="nombre"
              className={claseCampo}
              maxLength={NOMBRE_MAXIMO}
              aria-invalid={errorNombre !== null}
              aria-describedby={errorNombre ? 'error-nombre' : undefined}
              {...enlazar('nombre')}
            />
            <MensajeError id="error-nombre" mensaje={errorNombre} />
          </div>

          <div>
            <label htmlFor="tipo" className={claseEtiqueta}>
              Tipo <Asterisco />
            </label>
            <select
              id="tipo"
              className={claseDesplegable}
              aria-invalid={errorTipo !== null}
              aria-describedby={errorTipo ? 'error-tipo' : undefined}
              {...enlazar('idTipo')}
            >
              <option value="" />
              {tipos.map((fila) => (
                <option key={fila[POS_CATALOGO_SALA.id]} value={fila[POS_CATALOGO_SALA.id]}>
                  {fila[POS_CATALOGO_SALA.nombre]}
                </option>
              ))}
            </select>
            <MensajeError id="error-tipo" mensaje={errorTipo} />
          </div>

          <div>
            <label htmlFor="formato" className={claseEtiqueta}>
              Formato <Asterisco />
            </label>
            <select
              id="formato"
              className={claseDesplegable}
              aria-invalid={errorFormato !== null}
              aria-describedby={errorFormato ? 'error-formato' : undefined}
              {...enlazar('idFormato')}
            >
              <option value="" />
              {formatos.map((fila) => (
                <option key={fila[POS_CATALOGO_SALA.id]} value={fila[POS_CATALOGO_SALA.id]}>
                  {fila[POS_CATALOGO_SALA.nombre]}
                </option>
              ))}
            </select>
            <MensajeError id="error-formato" mensaje={errorFormato} />
          </div>

          <CampoSoloLectura id="precio" etiqueta="Precio" valor={precio === null ? null : formatearColones(precio)} />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="sede" className={claseEtiqueta}>
              Cine <Asterisco />
            </label>
            <select
              id="sede"
              className={claseDesplegable}
              aria-invalid={errorSede !== null}
              aria-describedby={errorSede ? 'error-sede' : undefined}
              {...enlazar('idSede')}
            >
              <option value="" />
              {sedes.map((sede) => (
                <option key={sede[POS_SEDE.id]} value={sede[POS_SEDE.id]}>
                  {sede[POS_SEDE.nombre]}
                </option>
              ))}
            </select>
            <MensajeError id="error-sede" mensaje={errorSede} />
          </div>

          <div>
            <label htmlFor="distribucion" className={claseEtiqueta}>
              Distribución <Asterisco />
            </label>
            <select
              id="distribucion"
              className={claseDesplegable}
              aria-invalid={errorDistribucion !== null}
              aria-describedby={errorDistribucion ? 'error-distribucion' : undefined}
              {...enlazar('idDistribucion')}
            >
              <option value="" />
              {distribuciones.map((fila) => (
                <option key={fila[POS_DISTRIBUCION.id]} value={fila[POS_DISTRIBUCION.id]}>
                  {fila[POS_DISTRIBUCION.nombre]}
                </option>
              ))}
            </select>
            <MensajeError id="error-distribucion" mensaje={errorDistribucion} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <CampoSoloLectura id="filas" etiqueta="Filas" valor={filas} />
            <CampoSoloLectura id="columnas" etiqueta="Columnas" valor={columnas} />
            <CampoSoloLectura id="total" etiqueta="Total de asientos" valor={distribucion?.[POS_DISTRIBUCION.total]} />
          </div>
        </div>
      </div>

      <section aria-label="Vista de la distribución" className="rounded-lg border border-border bg-surface px-6 py-8">
        {asientos.length > 0 ? (
          <MapaAsientos asientos={asientos} soloVista />
        ) : (
          <p className="text-center text-text-muted">
            Elija una distribución para ver cómo quedarán los asientos de la sala.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-4">
        <MensajeError mensaje={error} className="mt-0" />

        {/* */}
        {hayCamposVacios && <p className="text-sm text-danger">* Espacio obligatorio</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={guardando} className={claseBotonConfirmar}>
            {guardando ? 'Guardando...' : textoGuardar}
          </button>

          <button type="button" onClick={alCancelar} className={claseBotonCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

export default FormularioSala;

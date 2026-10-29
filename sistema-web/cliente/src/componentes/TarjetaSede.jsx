import { formatearHora } from '../utilidades/fechas.js';

function IconoUbicacion() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.1-7-11.5a7 7 0 1 1 14 0C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function BloqueFormato({ formato, idSeleccionado, alSeleccionar, alContinuar }) {
  const seleccionEnBloque = formato.horarios.some((horario) => horario.idProyeccion === idSeleccionado);

  return (
    <section className="rounded-lg bg-surface px-6 py-5">
      <h3 className="text-lg font-semibold text-text-color">{formato.nombre}</h3>
      <p className="mb-4 text-sm text-white/70">Seleccione y continúe con la compra</p>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <ul className="flex flex-wrap gap-3">
          {formato.horarios.map((horario) => {
            const activo = horario.idProyeccion === idSeleccionado;
            return (
              <li key={horario.idProyeccion}>
                <button
                  type="button"
                  onClick={() => alSeleccionar(horario.idProyeccion)}
                  aria-pressed={activo}
                  className={
                    'rounded-md border px-4 py-2 text-sm ' +
                    (activo
                      ? 'border-brand-soft bg-brand text-text-color'
                      : 'border-border bg-background text-text-color hover:border-brand-soft')
                  }
                >
                  {formatearHora(horario.hora)}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => alContinuar(idSeleccionado)}
          disabled={!seleccionEnBloque}
          className="flex items-center gap-2 rounded-md bg-brand px-5 py-2 text-sm text-text-color hover:bg-brand-hover disabled:opacity-40 disabled:hover:bg-brand"
        >
          Continuar
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function TarjetaSede({ sede, idSeleccionado, alSeleccionar, alContinuar }) {
  return (
    <article className="flex flex-col gap-1">
      <div className="rounded-lg bg-surface px-6 py-4">
        <h2 className="text-xl font-semibold text-text-color">{sede.nombre}</h2>
        <p className="flex items-center gap-1 text-sm text-brand-soft">
          <IconoUbicacion />
          {sede.provincia}
        </p>
      </div>

      {sede.formatos.map((formato) => (
        <BloqueFormato
          key={formato.idFormato}
          formato={formato}
          idSeleccionado={idSeleccionado}
          alSeleccionar={alSeleccionar}
          alContinuar={alContinuar}
        />
      ))}
    </article>
  );
}

export default TarjetaSede;
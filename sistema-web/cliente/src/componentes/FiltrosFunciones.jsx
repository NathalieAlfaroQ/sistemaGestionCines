const claseSelect =
  'min-w-48 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-color ' +
  'focus:border-brand-soft focus:ring-brand-soft';

function Filtro({ id, etiqueta, textoTodos, opciones, valor, alCambiar }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label htmlFor={id} className="text-text-color">
        {etiqueta}
      </label>
      <select id={id} value={valor} onChange={(evento) => alCambiar(evento.target.value)} className={claseSelect}>
        <option value="">{textoTodos}</option>
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>
            {opcion.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

function FiltrosFunciones({ sedes, formatos, filtros, alCambiar }) {
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-4 rounded-lg bg-surface px-6 py-5">
      <Filtro
        id="filtro-sede"
        etiqueta="Seleccionar un cine"
        textoTodos="Todos los cines"
        opciones={sedes}
        valor={filtros.idSede}
        alCambiar={(idSede) => alCambiar({ ...filtros, idSede })}
      />
      <Filtro
        id="filtro-formato"
        etiqueta="Seleccionar un formato"
        textoTodos="Todos los formatos"
        opciones={formatos}
        valor={filtros.idFormato}
        alCambiar={(idFormato) => alCambiar({ ...filtros, idFormato })}
      />
    </div>
  );
}

export default FiltrosFunciones;
// Puedes crear un icono de usuario o usar este
function IconoUsuario() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function TarjetaEmpleado({ empleado, alEditar, alEliminar }) {
  // Determinamos si es Admin o Empleado para pintar el badge de color
  const esAdmin = empleado.tipoUsuario === 'ADMINISTRADOR';
  const colorRol = esAdmin 
    ? 'bg-warning/20 text-warning border-warning/30' 
    : 'bg-success/20 text-success border-success/30';

  return (
    <article className="flex flex-col gap-1">
      <div className="rounded-lg bg-surface px-6 py-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-text-color">
            {empleado.nombre} {empleado.apellido}
          </h2>
          <p className="flex items-center gap-1 text-sm text-brand-soft mt-1">
            <IconoUsuario />
            {empleado.correo}
          </p>
        </div>
        
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colorRol}`}>
          {empleado.tipoUsuario}
        </span>
      </div>

      <section className="rounded-lg bg-surface px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Información de la sede */}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-white/70">Sede asignada</p>
            <p className="text-sm font-medium text-text-color">
              {empleado.nombreSede || 'Sin sede asignada'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => alEditar(empleado)}
              className="rounded-md border border-border px-4 py-2 text-sm text-text-color hover:border-brand-soft transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => alEliminar(empleado)}
              className="rounded-md border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger hover:bg-danger/20 transition-colors"
            >
              Eliminar
            </button>
          </div>
          
        </div>
      </section>
    </article>
  );
}

export default TarjetaEmpleado;
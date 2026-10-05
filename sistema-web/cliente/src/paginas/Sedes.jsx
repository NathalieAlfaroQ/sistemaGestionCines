import { useState } from 'react';
import { useSedes } from '../ganchos/useSedes.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import { POS_SEDE } from '../constantes/posicionesSede.js';
import Tabla from '../common/Tabla.jsx';

const columnas = [
  { titulo: 'Sede', posicion: POS_SEDE.nombre },
  { titulo: 'Cantón', posicion: POS_SEDE.canton },
  { titulo: 'Provincia', posicion: POS_SEDE.provincia },
];

function Sedes() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const { sedes, cargando, error } = useSedes(busquedaRetrasada);

  function editarSede(sede) {
    console.log('Editar sede', sede[POS_SEDE.id]);
  }

  function eliminarSede(sede) {
    if (window.confirm(`¿Eliminar la sede "${sede[POS_SEDE.nombre]}"?`)) {
      console.log('Eliminar sede', sede[POS_SEDE.id]);
    }
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-5 text-4xl font-bold">Sedes</h1>

        <input
          type="search"
          className="mb-12 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-text-color placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft"
          placeholder="Buscar sedes"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        /> 

        {cargando && <p className="text-text-muted">Cargando sedes...</p>}
        {error && <p className="text-danger">{error}</p>}
        {!cargando && !error && (
          <Tabla
            columnas={columnas}
            filas={sedes}
            posicionId={POS_SEDE.id}
            textoVacio="No hay sedes para mostrar en este momento"
            onEditar={editarSede}
            onEliminar={eliminarSede}
          />
        )}
      </div>
    </main>
  );
}

export default Sedes;

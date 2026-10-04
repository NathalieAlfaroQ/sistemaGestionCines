import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSedes } from '../ganchos/useSedes.js';
import { usePaginacion } from '../ganchos/usePaginacion.js';
import TablaSedes from '../componentes/TablaSedes.jsx';
import Paginacion from '../componentes/Paginacion.jsx';

// Para que "san jose" encuentre "San José".
const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function Sedes() {
  const { sedes, cargando, error } = useSedes();
  const [busqueda, setBusqueda] = useState('');

  const texto = normalizar(busqueda.trim());
  const filtradas = sedes.filter((sede) =>
    [sede.nombre, sede.ciudad, sede.provincia].some((campo) => normalizar(campo).includes(texto))
  );
  const paginacion = usePaginacion(filtradas);

  function alBuscar(evento) {
    setBusqueda(evento.target.value);
    paginacion.irAPagina(1);
  }

  return (
    <main className="min-h-screen bg-fondo text-white">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-5">
          <h1 className="text-4xl font-bold">Sedes</h1>

          <Link
            to="/sedes/nueva"
            className="px-5 py-2.5 rounded-lg bg-boton text-sm font-medium text-white hover:brightness-125"
          >
            Crear
          </Link>
        </div>

        <input
          type="search"
          aria-label="Buscar sedes"
          className="mb-12 w-85 max-w-full px-4 py-2 rounded-lg bg-white text-black placeholder:text-gray-500"
          placeholder="Buscar sedes"
          value={busqueda}
          onChange={alBuscar}
        />

        {cargando && <p className="text-white">Cargando sedes...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!cargando && !error && filtradas.length === 0 && (
          <p className="text-white">
            {busqueda ? 'Ninguna sede coincide con la búsqueda' : 'Aún no hay sedes registradas'}
          </p>
        )}

        {!cargando && !error && filtradas.length > 0 && (
          <>
            <TablaSedes sedes={paginacion.visibles} desde={paginacion.desde} />
            <Paginacion {...paginacion} />
          </>
        )}
      </div>
    </main>
  );
}

export default Sedes;

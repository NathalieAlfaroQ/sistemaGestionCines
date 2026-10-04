import { useState } from 'react';
import { useSedes } from '../ganchos/useSedes.js';
import { useDebounce } from '../ganchos/useDebounce.js';
import TablaSedes from '../componentes/TablaSedes.jsx';

function Sedes() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const { sedes, cargando, error } = useSedes(busquedaRetrasada);

  return (
    <main className="min-h-screen bg-fondo text-white">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-5 text-4xl font-bold">Sedes</h1>

        <input
          type="search"
          className="mb-12 w-85 px-4 py-2 rounded-lg bg-white text-black placeholder:text-gray-500"
          placeholder="Buscar sedes"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="text-white">Cargando sedes...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!cargando && !error && <TablaSedes sedes={sedes} />}
      </div>
    </main>
  );
}

export default Sedes;

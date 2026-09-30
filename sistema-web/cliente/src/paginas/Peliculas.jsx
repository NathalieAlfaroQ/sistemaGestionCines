import { Button, TextInput } from 'flowbite-react'
import { usePeliculas } from '../ganchos/usePeliculas.js'
import TablaPeliculas from '../componentes/TablaPeliculas.jsx'
import { useDebounce } from '../ganchos/useDebounce.js'
import { useState } from 'react'

function Peliculas() {
  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const { peliculas, cargando, error } = usePeliculas(busquedaRetrasada);
  
  return (
    <main>
      <div>
        <h1>Películas</h1>
        <Button>Crear película</Button>
      </div>

      <TextInput
        placeholder="Buscar películas"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
      />

      {cargando && <p>Cargando películas...</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && <TablaPeliculas peliculas={peliculas} />}
    </main>
  );
}

export default Peliculas;
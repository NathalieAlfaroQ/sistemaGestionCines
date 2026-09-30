import { Button } from 'flowbite-react';
import { usePeliculas } from '../ganchos/usePeliculas.js';
import TablaPeliculas from '../componentes/TablaPeliculas.jsx';

function Peliculas() {
  const { peliculas, cargando, error } = usePeliculas();

  return (
    <main>
      <div>
        <h1>Películas</h1>
        <Button>Crear película</Button>
      </div>

      {cargando && <p>Cargando películas...</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && <TablaPeliculas peliculas={peliculas} />}
    </main>
  );
}

export default Peliculas;
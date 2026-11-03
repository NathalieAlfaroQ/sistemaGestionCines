import { useCartelera } from '../ganchos/useCartelera.js';
import { POS_PELICULA_CARTELERA as POS_PELICULA, POS_SEDE_CARTELERA as POS_SEDE } from '../constantes/posicionesCartelera.js';
import CarruselPeliculas from '../componentes/CarruselPeliculas.jsx';
import TarjetaPelicula from '../componentes/TarjetaPelicula.jsx';
import ContenedorCliente from '../componentes/ContenedorCliente.jsx';
import ErrorCarga from '../componentes/ErrorCarga.jsx';

const claseSelector = 'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-color focus:border-brand-soft focus:ring-brand-soft';

function Eslogan() {
  return (
    <h1 className="max-w-3xl text-3xl font-bold text-text-color md:text-4xl">
      LA PANTALLA GRANDE TE ESPERA.
      <br />
      CONSIGUE TUS BOLETOS.
    </h1>
  );
}

function Inicio() {
  const { sedes, idSede, elegirSede, peliculas, cargando, error, recargar } = useCartelera();

  const paraCarrusel = peliculas.filter((pelicula) => pelicula[POS_PELICULA.urlCarrusel]);

  function contenidoCartelera() {
    if (error) {
      return <ErrorCarga error={error} alReintentar={recargar} />;
    }
    if (cargando) return <p className="text-text-color">Cargando cartelera...</p>;
    if (sedes.length === 0) return <p className="text-text-color">No hay cines disponibles por el momento.</p>;
    if (peliculas.length === 0) {
      return <p className="text-text-color">No hay películas en cartelera en este cine por el momento.</p>;
    }

    return (
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {peliculas.map((pelicula) => (
          <li key={pelicula[POS_PELICULA.id]}>
            <TarjetaPelicula pelicula={pelicula} idSede={idSede} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <CarruselPeliculas key={idSede} peliculas={paraCarrusel} idSede={idSede}>
        <Eslogan />
      </CarruselPeliculas>

      <ContenedorCliente className="flex flex-col gap-6 py-10">
        <h2 className="text-xl font-bold text-text-color">CARTELERA</h2>

        <div>
          <label htmlFor="cine" className="sr-only">
            Cine
          </label>
          <select id="cine" className={claseSelector} value={idSede} onChange={(evento) => elegirSede(evento.target.value)}>
            {sedes.map((sede) => (
              <option key={sede[POS_SEDE.id]} value={sede[POS_SEDE.id]}>
                {sede[POS_SEDE.nombre]}
              </option>
            ))}
          </select>
        </div>

        {contenidoCartelera()}
      </ContenedorCliente>
    </main>
  );
}

export default Inicio;

import { Link } from 'react-router-dom';
import { IconoFacebook, IconoInstagram } from './iconos.jsx';

const claseRed = 'rounded text-text-color hover:text-text-color/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-color';

function PiePagina({ redes = {} }) {
  const { facebook = '#', instagram = '#' } = redes;

  return (
    <footer className="mt-8 w-full bg-footer px-6 py-6 text-text-color sm:px-8 md:px-12">
      <div className="mx-auto flex flex-col items-start gap-3">
        <h3 className="text-sm">Historia</h3>

        <div className="flex gap-3">
          <a href={facebook} aria-label="Facebook" className={claseRed}>
            <IconoFacebook />
          </a>
          <a href={instagram} aria-label="Instagram" className={claseRed}>
            <IconoInstagram />
          </a>
        </div>

        <p className="text-xs">
          © Cines Aurora 2026. Derechos reservados.{' '}
          <Link to="/terminos" className="whitespace-nowrap underline underline-offset-2 hover:text-text-color/70 focus-visible:text-text-color/70">
            Términos y condiciones
          </Link>
        </p>
      </div>
    </footer>
  );
}

export default PiePagina;

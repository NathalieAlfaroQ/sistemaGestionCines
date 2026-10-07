import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const claseEnlace = 'px-3 py-2 md:p-0 block rounded text-text-color hover:text-brand-soft';

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Películas', ruta: '/peliculas' },
  { texto: 'Salas', ruta: '/salas' },
  { texto: 'Empleados', ruta: '/empleados' },
  { texto: 'Sedes', ruta: '/sedes' },
  { texto: 'Comprar', ruta: '/comprar' },
  { texto: 'Perfil', ruta: '/perfil' },
];

function Navbar() {
  return (
    <nav className="w-full sticky top-0 z-20 bg-navbar">
      <div className="max-w-screen-2xl mx-auto px-8 py-6 flex items-center gap-12">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} className="h-15 w-15 rounded object-cover" alt="Logo de Cine Aurora" />
        </Link>

        <ul className="hidden md:flex md:gap-8 flex-col md:flex-row font-medium">
          {enlaces.map((enlace) => (
            <li key={enlace.ruta}>
              <Link to={enlace.ruta} className={claseEnlace}>
                {enlace.texto}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
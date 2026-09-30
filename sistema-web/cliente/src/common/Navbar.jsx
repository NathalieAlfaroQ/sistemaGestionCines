import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const claseEnlace =
  'block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400';

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Películas', ruta: '/peliculas' },
  { texto: 'Salas', ruta: '/salas' },
  { texto: 'Proyecciones', ruta: '/proyecciones' },
  { texto: 'Empleados', ruta: '/empleados' },
  { texto: 'Comprar', ruta: '/comprar' },
  { texto: 'Perfil', ruta: '/perfil' },
];

function Navbar() {
  return (
    <nav className="w-full fixed top-0 start-0 z-20 border-b border-gray-700 bg-black">
      <div className="max-w-screen-xl mx-auto p-4 flex flex-wrap items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img src={logo} className="h-7" alt="Logo de Cine Aurora" />
          <span className="self-center text-xl font-semibold whitespace-nowrap text-white">
            Cine Aurora
          </span>
        </Link>

        <div className="hidden w-full md:w-auto md:order-1 md:flex items-center justify-between">
          <ul className="mt-4 p-4 md:mt-0 md:p-0 flex flex-col md:flex-row md:space-x-8 rounded border border-gray-700 md:border-0 font-medium bg-gray-900 md:bg-transparent">
            {enlaces.map((enlace) => (
              <li key={enlace.ruta}>
                <Link to={enlace.ruta} className={claseEnlace}>
                  {enlace.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
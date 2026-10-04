import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const claseEnlace = 'px-3 py-2 md:p-0 block rounded text-white hover:text-linea';

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Películas', ruta: '/peliculas' },
  { texto: 'Salas', ruta: '/salas' },
  { texto: 'Proyecciones', ruta: '/proyecciones' },
  { texto: 'Empleados', ruta: '/empleados' },
  { texto: 'Comprar', ruta: '/comprar' },
  { texto: 'Perfil', ruta: '/perfil' },
  { texto: 'Sedes', ruta: '/sedes' },
];

function BarraNavegacion() {
  return (
    <nav className="w-full fixed top-0 start-0 z-20 bg-black">
      <div className="max-w-screen-2xl mx-auto px-8 py-6 flex items-center gap-12">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} className="h-15 w-15 rounded object-cover" alt="Logo de Cine Aurora" />
          <span className="text-2xl font-semibold whitespace-nowrap text-white">
            Cine Aurora
          </span>
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

export default BarraNavegacion;
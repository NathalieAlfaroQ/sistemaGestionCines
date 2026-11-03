import BarraNavegacion from './BarraNavegacion.jsx';
import logo from '../assets/logo.jpg';

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Películas', ruta: '/peliculas' },
  { texto: 'Salas', ruta: '/salas' },
  { texto: 'Proyecciones', ruta: '/proyecciones' },
  { texto: 'Sedes', ruta: '/sedes' },
  { texto: 'Empleados', ruta: '/empleados' },
  { texto: 'Comprar', ruta: '/' },
];

function BarraEmpleado({ rutaIniciarSesion, opcionesExtra = [] }) {
  const opcionesPerfil = [{ texto: 'Mi perfil', ruta: '/perfil' }, ...opcionesExtra];

  return (
    <BarraNavegacion
      logo={logo}
      enlaces={enlaces}
      rutaIniciarSesion={rutaIniciarSesion}
      opcionesPerfil={opcionesPerfil}
    />
  );
}

export default BarraEmpleado;

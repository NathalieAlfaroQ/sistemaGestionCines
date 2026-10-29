import BarraNavegacion from './BarraNavegacion.jsx';
import logo from '../assets/logo.jpg';

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Películas', ruta: '/peliculas' },
  { texto: 'Salas', ruta: '/salas' },
  { texto: 'Proyecciones', ruta: '/proyecciones' },
  { texto: 'Sedes', ruta: '/sedes' },
  { texto: 'Empleados', ruta: '/empleados' },
];

function BarraEmpleado({ usuario = null, alCerrarSesion, rutaIniciarSesion, opcionesExtra = [] }) {
  const opcionesPerfil = [{ texto: 'Mi perfil', ruta: '/perfil' }, ...opcionesExtra];

  return (
    <BarraNavegacion
      logo={logo}
      enlaces={enlaces}
      usuario={usuario}
      rutaIniciarSesion={rutaIniciarSesion}
      opcionesPerfil={opcionesPerfil}
      alCerrarSesion={alCerrarSesion}
    />
  );
}

export default BarraEmpleado;

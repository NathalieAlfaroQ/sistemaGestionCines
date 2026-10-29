import BarraNavegacion from './BarraNavegacion.jsx';
import logo from '../assets/logo.jpg';

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Cartelera', ruta: '/' },
];

function BarraCliente({ usuario = null, alCerrarSesion, rutaIniciarSesion, opcionesExtra = [] }) {
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

export default BarraCliente;

import BarraNavegacion from './BarraNavegacion.jsx';
import logo from '../assets/logo.jpg';
import { obtenerUsuario } from '../servicios/sesion.js';

const ROLES_PERSONAL = ['EMPLEADO', 'ADMINISTRADOR'];

const enlaces = [
  { texto: 'Dulcería', ruta: '/dulceria' },
  { texto: 'Cartelera', ruta: '/' },
];

function BarraCliente({ rutaIniciarSesion, opcionesExtra = [] }) {
  const esPersonal = ROLES_PERSONAL.includes(obtenerUsuario()?.tipoUsuario);
  const enlacesVisibles = esPersonal ? [...enlaces, { texto: 'Trabajo', ruta: '/peliculas' }] : enlaces;
  const opcionesPerfil = [{ texto: 'Mi perfil', ruta: '/perfil' }, ...opcionesExtra];

  return (
    <BarraNavegacion
      logo={logo}
      enlaces={enlacesVisibles}
      rutaIniciarSesion={rutaIniciarSesion}
      opcionesPerfil={opcionesPerfil}
    />
  );
}

export default BarraCliente;

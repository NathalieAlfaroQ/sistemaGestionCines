import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  Tooltip,
} from 'flowbite-react';
import { cerrarSesion, obtenerUsuario } from '../servicios/sesion.js';

const claseBarra = 'sticky top-4 z-30 mx-4 rounded-2xl bg-navbar text-text-color shadow-lg md:mx-8 dark:bg-navbar';
const claseHamburguesa = 'text-text-color hover:bg-white/10 dark:text-text-color dark:hover:bg-white/10';
const claseLista = 'md:ml-8 md:mr-auto md:[&_ul]:space-x-5';
const claseEnlace =
  'border-b-0 text-text-color/70 hover:bg-transparent hover:text-text-color md:hover:text-text-color ' +
  'dark:text-text-color/70 dark:hover:bg-transparent dark:hover:text-text-color md:dark:hover:text-text-color';
const claseEnlaceActivo =
  'bg-transparent font-semibold text-text-color underline decoration-2 underline-offset-8 ' +
  'md:bg-transparent md:text-text-color dark:text-text-color';

const temaMenuUsuario = {
  floating: {
    base: 'z-10 w-fit divide-y divide-border rounded-lg shadow-lg focus:outline-none',
    style: {
      auto: 'border border-border bg-surface text-text-color dark:border-border dark:bg-surface dark:text-text-color',
    },
    header: 'block px-4 py-2 text-sm text-text-color dark:text-text-color',
    divider: 'my-1 h-px bg-border dark:bg-border',
    item: {
      base:
        'flex w-full cursor-pointer items-center justify-start px-4 py-2 text-sm text-text-color transition ' +
        'hover:bg-brand focus:bg-brand focus:outline-none ' +
        'dark:text-text-color dark:hover:bg-brand dark:hover:text-text-color dark:focus:bg-brand dark:focus:text-text-color',
    },
  },
};

function BarraNavegacion({
  enlaces,
  logo,
  nombreSitio = 'Cines Aurora',
  rutaInicio = '/',
  rutaIniciarSesion = '/iniciar-sesion',
  opcionesPerfil = [],
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const usuario = obtenerUsuario();

  function alCerrarSesion() {
    cerrarSesion();
    navigate('/iniciar-sesion');
  }

  const estaActivo = (ruta) => (ruta === '/' ? pathname === '/' : pathname.startsWith(ruta));
  const nombreUsuario = usuario?.nombre ?? usuario?.nombreUsuario ?? usuario?.correo ?? 'Mi cuenta';

  return (
    <Navbar rounded fluid className={claseBarra}>
      <Tooltip content={nombreSitio} placement="bottom">
        <NavbarBrand as={Link} to={rutaInicio} aria-label={`${nombreSitio}, ir al inicio`}>
          <img src={logo} className="h-12 w-12 rounded object-cover md:h-14 md:w-14" alt="" />
        </NavbarBrand>
      </Tooltip>

      <div className="flex items-center gap-2 md:order-2">
        {!usuario && (
          <Link to={rutaIniciarSesion} className={claseEnlace}>
            Iniciar sesión
          </Link>
        )}

        {usuario && (
          <Dropdown
            theme={temaMenuUsuario}
            inline
            arrowIcon={false}
            placement="bottom-end"
            renderTrigger={() => (
              <button type="button" aria-label="Menú del usuario" className={claseEnlace}>
                Perfil
              </button>
            )}
          >
            <DropdownHeader>
              <span className="block max-w-48 truncate text-sm font-medium">{nombreUsuario}</span>
            </DropdownHeader>

            {opcionesPerfil.map((opcion) =>
              opcion.ruta ? (
                <DropdownItem key={opcion.texto} as={Link} to={opcion.ruta}>
                  {opcion.texto}
                </DropdownItem>
              ) : (
                <DropdownItem key={opcion.texto} onClick={opcion.alPulsar}>
                  {opcion.texto}
                </DropdownItem>
              )
            )}

            <DropdownDivider />
            <DropdownItem onClick={alCerrarSesion}>Cerrar sesión</DropdownItem>
          </Dropdown>
        )}

        <NavbarToggle aria-label="Abrir o cerrar el menú principal" className={claseHamburguesa} />
      </div>

      <NavbarCollapse className={claseLista}>
        {enlaces.map((enlace) => {
          const activo = estaActivo(enlace.ruta);
          return (
            <NavbarLink
              key={enlace.ruta}
              as={Link}
              to={enlace.ruta}
              active={activo}
              aria-current={activo ? 'page' : undefined}
              className={activo ? claseEnlaceActivo : claseEnlace}
            >
              {enlace.texto}
            </NavbarLink>
          );
        })}
      </NavbarCollapse>
    </Navbar>
  );
}

export default BarraNavegacion;

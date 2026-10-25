import { Link, useLocation } from 'react-router-dom';
import {
  Avatar,
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

const claseBarra = 'sticky top-4 z-30 mx-4 rounded-2xl bg-navbar text-text-color shadow-lg md:mx-8 dark:bg-navbar';
const claseHamburguesa = 'text-text-color hover:bg-white/10 dark:text-text-color dark:hover:bg-white/10';
const claseLista = 'md:ml-8 md:mr-auto md:[&_ul]:space-x-5';
const claseEnlace =
  'border-b-0 text-text-color/70 hover:bg-transparent hover:text-text-color md:hover:text-text-color ' +
  'dark:text-text-color/70 dark:hover:bg-transparent dark:hover:text-text-color md:dark:hover:text-text-color';
const claseEnlaceActivo =
  'bg-transparent font-semibold text-text-color underline decoration-2 underline-offset-8 ' +
  'md:bg-transparent md:text-text-color dark:text-text-color';

function BarraNavegacion({
  enlaces,
  logo,
  nombreSitio = 'Cines Aurora',
  rutaInicio = '/',
  usuario = null,
  rutaIniciarSesion = '/iniciar-sesion',
  opcionesPerfil = [],
  alCerrarSesion,
}) {
  const { pathname } = useLocation();
  const estaActivo = (ruta) => (ruta === '/' ? pathname === '/' : pathname.startsWith(ruta));
  // Sin sesión, "Iniciar sesión" es un enlace más, junto a los demás
  const todosLosEnlaces = usuario ? enlaces : [...enlaces, { texto: 'Iniciar sesión', ruta: rutaIniciarSesion }];
  const nombreUsuario = usuario?.nombre ?? usuario?.nombreUsuario ?? usuario?.correo ?? 'Mi cuenta';

  return (
    <Navbar rounded fluid className={claseBarra}>
      <Tooltip content={nombreSitio} placement="bottom">
        <NavbarBrand as={Link} to={rutaInicio} aria-label={`${nombreSitio}, ir al inicio`}>
          <img src={logo} className="h-12 w-12 rounded object-cover md:h-14 md:w-14" alt="" />
        </NavbarBrand>
      </Tooltip>

      <div className="flex items-center gap-2 md:order-2">
        {usuario && (
          <Dropdown
            inline
            arrowIcon={false}
            placement="bottom-end"
            renderTrigger={() => (
              <button type="button" aria-label="Menú del usuario" className="rounded-full">
                <Avatar rounded />
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
        {todosLosEnlaces.map((enlace) => {
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

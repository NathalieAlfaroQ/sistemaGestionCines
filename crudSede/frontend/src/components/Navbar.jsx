function Navbar() {

  return (
    <nav className="bg-navbar fixed w-full z-20 top-0 start-0 border-b border-default">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
 
        <a className="flex items-center space-x-3 rtl:space-x-reverse">

            <img src="/logo.png"
                 className="h-7"
                 alt="Logo"
            />

            <span className="self-center text-xl text-heading font-semibold whitespace-nowrap text-text-color">
              Cine Aurora
            </span>
        </a>

        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse"></div>

        <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">

          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-default rounded-base bg-neutral-secondary-soft md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-neutral-primary">

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Dulcería
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Películas
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Salas
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Proyecciones
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Empleados
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Comprar
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-text-color hover:bg-navbar md:bg-transparent md:p-0 md:hover:text-brand-hover">
                Perfil
              </a>
            </li>

          </ul>
        </div>
      </div>
    </nav>

  )
}

export default Navbar

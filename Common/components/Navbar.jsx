function Navbar() {

  return (
    <nav class="bg-black fixed w-full z-20 top-0 start-0 border-b border-default">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
 
        <a class="flex items-center space-x-3 rtl:space-x-reverse">

            <img src="../assets/logo.jpg"
                 class="h-7"
                 alt="Logo"
            />

            <span class="self-center text-xl text-heading font-semibold whitespace-nowrap text-white">
              Cine Aurora
            </span>
        </a>

        <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse"></div>

        <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">

          <ul class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-default rounded-base bg-neutral-secondary-soft md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-neutral-primary">

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
                Dulcería
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
                Películas
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
                Salas
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
                Proyecciones
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
                Empleados
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
                Comprar
              </a>
            </li>

            <li>
              <a
                href="#"
                className="block rounded px-3 py-2 text-white hover:bg-gray-800 md:bg-transparent md:p-0 md:hover:text-purple-400">
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

function Navbar() {
  return (
    <nav className="mx-auto mt-8 w-[85%] rounded-md bg-black px-6 py-3">
      <div className="flex items-center">

        <div>
          <img
            src="../assets/logo.png"
            alt="Cine Aurora"
            className="h-10 w-auto"
          />
        </div>

        <div className="ml-8 flex flex-1 items-center justify-between">

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Dulcería
          </a>

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Películas
          </a>

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Salas
          </a>

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Proyecciones
          </a>

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Empleados
          </a>

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Comprar
          </a>

          <a
            href="#"
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            Perfil
          </a>

        </div>

      </div>
    </nav>
  )
}

export default Navbar

function Buscador({ placeholder = 'Buscar' }) {
  return (
    <form className="w-64">
      
      <label htmlFor="search" className="sr-only">
        {placeholder}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
         
          <svg
            className="h-4 w-4 text-black"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>

        <input
          type="search"
          id="search"
          className="block w-full rounded-md border border-gray-300 bg-white p-2.5 ps-9 text-sm text-black placeholder-gray-600 focus:border-gray-400 focus:ring-gray-300 shadow-xs" placeholder={placeholder}
        />
      </div>
    </form>
  )
}
export default Buscador
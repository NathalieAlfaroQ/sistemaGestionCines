const SearchBar = ({ placeholder = "Buscar" }) => {
  return (
    <form className="max-w-md mx-auto">
      <label for="search" className="block mb-2.5 text-sm font-medium text-heading text-text-muted sr-only">
        {placeholder}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3
                        pointer-events-none">
          <svg className="h-4 w-4 text-text-muted"
               aria-hidden="true"
               xmlns="http://www.w3.org/2000/svg"
               width="24"
               height="24"
               fill="none"
               viewBox="0 0 24 24" >

              <path stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
          </svg>
        </div>

        <input type="search"
               id="search"
               className="block w-full rounded-base border border-border bg-surface
                      p-2.5 ps-9 text-sm text-text-muted placeholder-text-muted
                      focus:bg-surface focus:border-border focus:ring-border
                      active:bg-surface active:border-border active:ring-border
                      shadow-xs"
               placeholder={placeholder}/>
      </div>
    </form>
  );
};

export default SearchBar;
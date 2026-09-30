import SearchBar from "../components/SearchBar";

const Sedes = () => {
  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-40">

        <h1 className="text-2xl font-semibold text-text-color">
          Sedes
        </h1>

        <button type="button"
                className="text-text-color bg-brand hover:bg-brand-hover
                           focus:ring-4 focus:ring-brand font-medium
                           rounded-lg text-sm px-3 py-2">
          Crear sede
          <span className="ml-1"></span>

        </button>
      </div>

      <div className="mb-6 w-80">

        <SearchBar placeholder="Buscar sedes"/>

      </div>
    </div>
  );
};

export default Sedes;

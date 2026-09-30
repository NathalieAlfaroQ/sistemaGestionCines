import SearchBar from "../components/SearchBar";
import Table from "../components/Table";

const sedes = [
  {
    id: 1,
    nombre: "Cine Aurora San Pedro",
    ciudad: "San Pedro",
    provincia: "San José",
  },
  {
    id: 2,
    nombre: "Cine Aurora Escazú",
    ciudad: "Escazú",
    provincia: "San José",
  },
  {
    id: 3,
    nombre: "Cine Aurora Heredia",
    ciudad: "Heredia",
    provincia: "Heredia",
  },
];

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
        <Table sedes={sedes}/>

      </div>
    </div>
  );
};

export default Sedes;

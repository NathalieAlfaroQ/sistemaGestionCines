import { Link } from 'react-router-dom'

function BarraNavegacion() {
  return (
    <nav className="w-full h-16 px-8 z-50 fixed top-0 flex items-center justify-between backdrop-blur-md bg-black text-white">
      <div className="flex gap-x-12 items-center">
        <div>Logo</div>
        <div className="flex gap-x-6">
          <a href="#cartelera">Cartelera</a>
          <Link to="/dulceria">Dulcería</Link>
          <Link to="/perfil">Perfil</Link>
        </div>
      </div>
      <div>Buscador</div>
    </nav>
  )
}

export default BarraNavegacion
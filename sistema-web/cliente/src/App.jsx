import { Routes, Route } from 'react-router-dom'

import Hero from './componentes/Hero'
import DisenoGestion from './common/DisenoGestion.jsx'
import Sedes from './paginas/Sedes.jsx'
import CrearSede from './paginas/CrearSede.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import VerPelicula from './paginas/VerPelicula.jsx'
import EditarPelicula from './paginas/EditarPelicula.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DisenoGestion />}>
        <Route path="/peliculas" element={<Peliculas />} />
        <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
        <Route path="/peliculas/:id" element={<VerPelicula />} />
        <Route path="/peliculas/:id/editar" element={<EditarPelicula />} />
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/perfil" element={<div>Perfil</div>} />
        <Route path="/" element={<Hero />} />
        <Route path="/sedes/nueva" element={<CrearSede />} />
        <Route path="/sedes" element={<Sedes />} />
      </Route>
    </Routes>
  )
}

export default App
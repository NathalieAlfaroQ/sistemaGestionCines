import { Routes, Route } from 'react-router-dom'
import Hero from './componentes/Hero'

import DisenoGestion from './common/DisenoGestion.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import Sedes from './paginas/Sedes.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DisenoGestion />}>
        <Route path="/" element={<Hero />} />
        <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
        <Route path="/peliculas" element={<Peliculas />} />
        <Route path="/dulceria" element={<div></div>} />
        <Route path="/perfil" element={<div></div>} />
        <Route path="/sedes" element={<Sedes />} />
      </Route>
    </Routes>
  )
}

export default App
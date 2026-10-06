import { Routes, Route } from 'react-router-dom'
import BarraNavegacion from './componentes/BarraNavegacion'
import Hero from './componentes/Hero'
import DisenoGestion from './common/DisenoGestion.jsx'
import Peliculas from './paginas/Peliculas.jsx'
import FormularioPelicula from './paginas/FormularioPelicula.jsx'
import VerPelicula from './paginas/VerPelicula.jsx'
import EditarPelicula from './paginas/EditarPelicula.jsx'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <BarraNavegacion />
            <Hero />
          </>
        }
      />

      <Route element={<DisenoGestion />}>
        <Route path="/peliculas" element={<Peliculas />} />
        <Route path="/peliculas/nueva" element={<FormularioPelicula />} />
        <Route path="/peliculas/:id" element={<VerPelicula />} />
        <Route path="/peliculas/:id/editar" element={<EditarPelicula />} />
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/perfil" element={<div>Perfil</div>} />
      </Route>
    </Routes>
  )
}

export default App
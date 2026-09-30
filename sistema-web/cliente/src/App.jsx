import { Routes, Route } from 'react-router-dom'
import BarraNavegacion from './componentes/BarraNavegacion'
import Hero from './componentes/Hero'
import DisenoGestion from './common/DisenoGestion.jsx'
import Peliculas from './paginas/Peliculas.jsx'

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
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/perfil" element={<div>Perfil</div>} />
      </Route>
    </Routes>
  )
}

export default App
import { Routes, Route } from 'react-router-dom'
import BarraNavegacion from './componentes/BarraNavegacion'
import Hero from './componentes/Hero'
import Peliculas from './paginas/Peliculas'

function App() {
  return (
    <>
      <BarraNavegacion />
      <Routes>
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/perfil" element={<div>Perfil</div>} />
        <Route path="/peliculas" element={<Peliculas />} />
      </Routes>
    </>
  )
}

export default App
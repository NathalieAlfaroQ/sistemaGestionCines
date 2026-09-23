import { Routes, Route } from 'react-router-dom'
import BarraNavegacion from './componentes/BarraNavegacion'

function App() {
  return (
    <>
      <BarraNavegacion />
      <Routes>
        <Route path="/dulceria" element={<div>Dulcería</div>} />
        <Route path="/perfil" element={<div>Perfil</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </>
  )
}

export default App
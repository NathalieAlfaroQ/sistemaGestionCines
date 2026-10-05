import { Routes, Route } from 'react-router-dom'
import Hero from './componentes/Hero'

import DisenoGestion from './common/DisenoGestion.jsx'
import Sedes from './paginas/Sedes.jsx'
import CrearSede from './paginas/CrearSede.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DisenoGestion />}>
        <Route path="/" element={<Hero />} />
        <Route path="/sedes/nueva" element={<CrearSede />} />
        <Route path="/sedes" element={<Sedes />} />
      </Route>
    </Routes>
  )
}

export default App
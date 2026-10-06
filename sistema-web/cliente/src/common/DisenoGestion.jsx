import { Outlet } from 'react-router-dom';
import BarraNavegacion from './BarraNavegacion.jsx';
import PiePagina from './PiePagina.jsx';

function DisenoGestion() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BarraNavegacion />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <PiePagina />
    </div>
  );
}

export default DisenoGestion;

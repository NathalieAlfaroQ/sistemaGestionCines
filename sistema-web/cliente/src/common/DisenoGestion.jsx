import { Outlet } from 'react-router-dom';
import BarraEmpleado from './BarraEmpleado.jsx';
import PiePagina from './PiePagina.jsx';

function DisenoGestion() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BarraEmpleado />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <PiePagina />
    </div>
  );
}

export default DisenoGestion;

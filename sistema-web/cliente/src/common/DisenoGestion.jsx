import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

function DisenoGestion() {
  return (
    <>
      <Navbar />
        <div className="pt-24">
          <Outlet />
        </div>
    </>
  );
}

export default DisenoGestion;
import { useState, useEffect } from 'react';
import Tabla from '../common/Tabla.jsx';
import CrearUsuario from '../componentes/CrearUsuario.jsx';
import { obtenerEmpleados } from '../servicios/servicioEmpleados.js'; 

const claseBoton = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);

  const cargarEmpleados = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerEmpleados(); 
      setEmpleados(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const columnas = [
    { titulo: 'Nombre', posicion: 'nombreCompleto' },
    { titulo: 'Correo', posicion: 'correo' },
    { titulo: 'Rol', posicion: 'tipoUsuario' },
    { titulo: 'Sede', posicion: 'nombreSede' },
  ];

  function usuarioCreado() {
    setCreando(false);
    alert('Usuario creado con éxito'); 
    cargarEmpleados();
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-35">
          <h1 className="text-4xl font-bold">Empleados</h1>

          <button type="button" onClick={() => setCreando(true)} className={claseBoton}>
            Crear
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {cargando && <p className="mb-4 text-text-muted">Cargando empleados...</p>}
        {error && <p className="mb-4 text-danger">{error}</p>}

        {!cargando && !error && (
          <Tabla
            columnas={columnas}
            filas={empleados}
            posicionId="idEmpleado"
            textoVacio="No se encontraron empleados"
          />
        )}
      </div>

      {creando && (
        <CrearUsuario alCancelar={() => setCreando(false)} alCrear={usuarioCreado} />
      )}
    </main>
  );
}

export default Empleados;
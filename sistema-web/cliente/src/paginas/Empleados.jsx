import { useState, useEffect } from 'react';
import Tabla from '../common/Tabla.jsx';
import CrearUsuario from '../componentes/CrearUsuario.jsx';
import EditarEmpleado from '../componentes/EditarEmpleado.jsx'; 
import ModalConfirmacion from '../common/ModalConfirmacion.jsx';
import { obtenerEmpleados, eliminarEmpleado } from '../servicios/servicioEmpleados.js'; 
import { useDebounce } from '../ganchos/useDebounce.js'; 
import { useNotificaciones } from '../ganchos/useNotificaciones.js';

const claseBarraBusqueda = 'mb-4 w-85 rounded-lg border border-border bg-surface-clear px-4 py-2 text-black placeholder:text-text-muted focus:border-brand-soft focus:ring-brand-soft';
const claseBoton = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const [creando, setCreando] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState(null); 
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null); 

  const [busqueda, setBusqueda] = useState('');
  const busquedaRetrasada = useDebounce(busqueda, 400);
  const notificaciones = useNotificaciones();

  const cargarEmpleados = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerEmpleados(); 
      
      const filtrados = busquedaRetrasada 
        ? data.filter(emp => 
            emp.nombreCompleto.toLowerCase().includes(busquedaRetrasada.toLowerCase()) ||
            emp.correo.toLowerCase().includes(busquedaRetrasada.toLowerCase())
          )
        : data;

      setEmpleados(filtrados);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, [busquedaRetrasada]); 

  const columnas = [
    { titulo: 'Nombre', posicion: 'nombreCompleto' },
    { titulo: 'Correo', posicion: 'correo' },
    { titulo: 'Rol', posicion: 'tipoUsuario' },
    { titulo: 'Sede', posicion: 'nombreSede' },
  ];

  function usuarioCreado() {
    setCreando(false);
    notificaciones.exito('Usuario creado con éxito');
    cargarEmpleados();
  }

  async function confirmarEliminacion() {
    const empleado = empleadoAEliminar;
    setEmpleadoAEliminar(null);
    try {
      await eliminarEmpleado(empleado.idEmpleado);
      notificaciones.exito('Empleado eliminado con éxito');
    } catch (err) {
      notificaciones.error(err.message);
    }
    cargarEmpleados();
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-12">
          <h1 className="text-4xl font-bold">Empleados</h1>

          <button type="button" onClick={() => setCreando(true)} className={claseBoton}>
            Crear
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <input
          type="search"
          className={claseBarraBusqueda}
          placeholder="Buscar empleados"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        {cargando && <p className="mb-4 text-text-muted">Cargando empleados...</p>}
        {error && <p className="mb-4 text-danger">{error}</p>}

        {!cargando && !error && (
          <Tabla
            columnas={columnas}
            filas={empleados}
            posicionId="idEmpleado"
            textoVacio={cargando ? '' : 'No se encontraron empleados'}
            onEditar={setEmpleadoAEditar}  
            onEliminar={setEmpleadoAEliminar} 
          />
        )}
      </div>

      {creando && (
        <CrearUsuario alCancelar={() => setCreando(false)} alCrear={usuarioCreado} />
      )}

      {empleadoAEditar && (
        <EditarEmpleado
          empleado={empleadoAEditar}
          alCancelar={() => setEmpleadoAEditar(null)}
          alEditar={() => {
            setEmpleadoAEditar(null);
            notificaciones.exito('Empleado editado con éxito');
            cargarEmpleados();
          }}
        />
      )}

      {empleadoAEliminar && (
        <ModalConfirmacion
          peligrosa
          titulo="Eliminar empleado"
          mensaje={`¿Está seguro de que desea eliminar a "${empleadoAEliminar.nombreCompleto}"? Esta acción es permanente.`}
          textoConfirmar="Eliminar"
          alConfirmar={confirmarEliminacion}
          alCancelar={() => setEmpleadoAEliminar(null)}
        />
      )}
    </main>
  );
}

export default Empleados;
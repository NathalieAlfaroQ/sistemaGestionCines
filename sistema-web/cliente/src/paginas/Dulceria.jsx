import { useState, useEffect } from 'react'
import Tabla from '../common/Tabla.jsx'
import CrearProducto from '../componentes/CrearProducto.jsx'
import EditarProducto from '../componentes/EditarProducto.jsx'
import ModalConfirmacion from '../common/ModalConfirmacion.jsx'
import { obtenerProductos, eliminarProducto } from '../servicios/servicioDulceria.js'
import { useNotificaciones } from '../ganchos/useNotificaciones.js'

const claseBoton = 'flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-color transition-colors hover:bg-brand-hover'

function Dulceria() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [creando, setCreando] = useState(false)
  const [productoAEditar, setProductoAEditar] = useState(null)
  const [productoAEliminar, setProductoAEliminar] = useState(null)
  const notificaciones = useNotificaciones()

  const cargar = async () => {
    setCargando(true); setError(null)
    try {
      setProductos(await obtenerProductos())
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { 
    void cargar() 
  }, [])

  const columnas = [
    { titulo: 'Producto', posicion: 'nombre' },
    { titulo: 'Precio', posicion: 'precio' },
    { titulo: 'Cantidad', posicion: 'cantidad' },
  ]

  async function confirmarEliminacion() {
    const p = productoAEliminar
    setProductoAEliminar(null)
    try {
      await eliminarProducto(p.idCantidadProducto)
      notificaciones.exito('Producto eliminado')
    } catch (e) {
      notificaciones.error(e.message)
    }
    void cargar()
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-5 flex items-center gap-12">
          <h1 className="text-4xl font-bold">Dulcería</h1>
          <button type="button" onClick={() => setCreando(true)} className={claseBoton}>Crear</button>
        </div>

        {cargando && <p className="mb-4 text-text-muted">Cargando productos...</p>}
        {error && <p className="mb-4 text-danger">{error}</p>}

        {!cargando && !error && (
          <Tabla
            columnas={columnas}
            filas={productos}
            posicionId="idCantidadProducto"
            textoVacio="No se encontraron productos"
            onEditar={setProductoAEditar}
            onEliminar={setProductoAEliminar}
          />
        )}
      </div>

      {creando && (
        <CrearProducto 
          alCancelar={() => setCreando(false)} 
          alCrear={() => { setCreando(false); notificaciones.exito('Producto creado'); void cargar() }} 
        />
      )}
      
      {productoAEditar && (
        <EditarProducto 
          producto={productoAEditar} 
          alCancelar={() => setProductoAEditar(null)} 
          alEditar={() => { setProductoAEditar(null); notificaciones.exito('Producto actualizado'); void cargar() }} 
        />
      )}
      
      {productoAEliminar && (
        <ModalConfirmacion
          peligrosa 
          titulo="Eliminar producto"
          mensaje={`¿Eliminar "${productoAEliminar.nombre}" de esta sucursal?`}
          textoConfirmar="Eliminar"
          alConfirmar={confirmarEliminacion}
          alCancelar={() => setProductoAEliminar(null)}
        />
      )}
    </main>
  )
}

export default Dulceria
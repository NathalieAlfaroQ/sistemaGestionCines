import { Navigate, Outlet } from 'react-router-dom'
import { obtenerToken, obtenerUsuario } from '../servicios/sesion.js'

export default function RutaProtegida({ rolesPermitidos }) {
  const token = obtenerToken()
  const usuario = obtenerUsuario()

  if (!token || !usuario) {
    return <Navigate to="/iniciar-sesion" replace />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.tipoUsuario)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
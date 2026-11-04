import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { iniciarSesionConGoogle } from '../servicios/autenticacionGoogle.js'
import { guardarSesion } from '../servicios/sesion.js'

export default function BotonGoogle({ alError }) {
  const navigate = useNavigate()

  const manejarExito = async (respuestaGoogle) => {
    try {
      const datos = await iniciarSesionConGoogle(respuestaGoogle.credential)
      guardarSesion(datos.token, datos.usuario)
      await navigate('/')
    } catch (error) {
      alError(error.message)
    }
  }

  return (
    <GoogleLogin
      onSuccess={manejarExito}
      onError={() => alError('No se pudo iniciar sesión con Google')}
      type="icon"
      theme="filled_blue"
      shape="circle"
    />
  )
}
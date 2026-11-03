import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import ProveedorNotificaciones from './componentes/ProveedorNotificaciones.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_ID_CLIENTE}>
      <BrowserRouter>
        <ProveedorNotificaciones>
          <App />
        </ProveedorNotificaciones>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
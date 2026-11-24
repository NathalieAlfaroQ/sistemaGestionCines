import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, TextInput, ThemeProvider } from 'flowbite-react';
import Boton from '../common/Boton.jsx';
import { useNotificaciones } from '../ganchos/useNotificaciones.js';
import { actualizarPerfil } from '../servicios/servicioPerfil.js';
import { guardarSesion, obtenerToken, obtenerUsuario } from '../servicios/sesion.js';
import { temaFormulario } from '../temas/temaFormulario.js';
import { validarNombreOApellido } from '../validaciones/validaciones.js';
import Campo from './Campo.jsx';
import MensajeError from './MensajeError.jsx';
import CampoSoloLectura from './CampoSoloLectura.jsx';
import ContenedorCliente from './ContenedorCliente.jsx';
import ContrasenaPerfil from './ContrasenaPerfil.jsx';

// Largo de las columnas en la base de datos: CLIENTES 50, EMPLEADOS y ADMINISTRADORES 20
const LIMITE_CLIENTE = 50;
const LIMITE_PERSONAL = 20;
const CAMPOS = [
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'apellido', etiqueta: 'Apellido' },
];

export default function Perfil() {
  const [usuario, setUsuario] = useState(obtenerUsuario);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { exito } = useNotificaciones();

  // Si presiona Perfil sin sesión iniciada, le pide que inicie sesión
  if (!usuario) return <Navigate to="/iniciar-sesion" replace />;

  const limite = usuario.tipoUsuario === 'CLIENTE' ? LIMITE_CLIENTE : LIMITE_PERSONAL;
  // Las cuentas de Google no tienen contraseña ni idCredencial: no se les muestra la opción de cambiarla
  const esGoogle = usuario.idCredencial === undefined;

  function empezar() {
    setForm({ nombre: usuario.nombre, apellido: usuario.apellido });
    setErrores({});
    setErrorGeneral('');
    setEditando(true);
  }

  function cambiar(clave, valor) {
    setForm((anterior) => ({ ...anterior, [clave]: valor }));
    setErrores((anterior) => ({ ...anterior, [clave]: '' }));
    setErrorGeneral('');
  }

  async function guardar(evento) {
    evento.preventDefault();

    // Solo se validan y se envían los campos que cambiaron (el apellido "-" de algunas cuentas de Google no debe bloquear el nombre)
    const cambios = {};
    const encontrados = {};
    for (const { clave } of CAMPOS) {
      const valor = form[clave].trim();
      if (valor === usuario[clave]) continue;
      cambios[clave] = valor;
      encontrados[clave] = valor ? validarNombreOApellido(valor) : 'Este campo es obligatorio';
    }
    setErrores(encontrados);
    if (Object.values(encontrados).some(Boolean)) return;

    if (Object.keys(cambios).length === 0) {
      setEditando(false);
      return;
    }

    setGuardando(true);
    try {
      const guardado = await actualizarPerfil(cambios);
      const actualizado = { ...usuario, nombre: guardado.nombre ?? usuario.nombre, apellido: guardado.apellido ?? usuario.apellido };

      guardarSesion(obtenerToken(), actualizado);
      setUsuario(actualizado);
      setEditando(false);
      exito('Perfil actualizado');
    } catch (fallo) {
      setErrorGeneral(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <ContenedorCliente className="flex flex-col gap-6 py-10">
        <ThemeProvider theme={temaFormulario}>
          <Card className="w-full max-w-xl border-border bg-surface dark:border-border dark:bg-surface">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-text-color">Perfil</h1>
              {!editando && (
                <Boton tamano="sm" onClick={empezar}>
                  Editar perfil
                </Boton>
              )}
            </div>

            <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
              {CAMPOS.map(({ clave, etiqueta }) => (
                <Campo key={clave} id={clave} etiqueta={etiqueta} error={errores[clave]}>
                  <TextInput
                    id={clave}
                    value={editando ? form[clave] : usuario[clave]}
                    maxLength={limite}
                    disabled={!editando || guardando}
                    color={errores[clave] ? 'failure' : 'gray'}
                    onChange={(evento) => cambiar(clave, evento.target.value)}
                  />
                </Campo>
              ))}

              {editando && (
                <>
                  <MensajeError mensaje={errorGeneral} />
                  <div className="flex gap-3">
                    <Boton type="submit" tamano="sm" disabled={guardando}>
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </Boton>
                    <Boton variante="contorno" tamano="sm" disabled={guardando} onClick={() => setEditando(false)}>
                      Cancelar
                    </Boton>
                  </div>
                </>
              )}
            </form>

            <CampoSoloLectura id="correo" etiqueta="Correo" valor={usuario.correo} />

            {!esGoogle && <ContrasenaPerfil correo={usuario.correo} />}
          </Card>
        </ThemeProvider>
      </ContenedorCliente>
    </main>
  );
}

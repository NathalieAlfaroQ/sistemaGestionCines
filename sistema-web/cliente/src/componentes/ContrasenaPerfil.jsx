import { useState } from 'react';
import { TextInput } from 'flowbite-react';
import Boton from '../common/Boton.jsx';
import { useNotificaciones } from '../ganchos/useNotificaciones.js';
import { cambiarContrasena } from '../servicios/servicioPerfil.js';
import { MENSAJES_ERROR, validarContrasenaFuerte } from '../validaciones/validaciones.js';
import Campo from './Campo.jsx';
import MensajeError from './MensajeError.jsx';

const VACIOS = { nueva: '', confirmar: '' };

// Siempre censurada: igual que en el inicio de sesión, es un input type="password" (aquí sin el ojo para verla).
// Perfil no la muestra para las cuentas de Google, que no tienen contraseña propia.
function ContrasenaPerfil({ correo }) {
  const { exito } = useNotificaciones();
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState(VACIOS);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  function abrir() {
    setCampos(VACIOS);
    setErrores({});
    setErrorGeneral('');
    setEditando(true);
  }

  function cambiar(nombre, valor) {
    setCampos((anteriores) => ({ ...anteriores, [nombre]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [nombre]: '' }));
    setErrorGeneral('');
  }

  async function guardar(evento) {
    evento.preventDefault();

    const encontrados = {
      nueva: campos.nueva ? validarContrasenaFuerte(campos.nueva) : 'Ingresa la contraseña nueva',
      confirmar: campos.confirmar === campos.nueva ? '' : MENSAJES_ERROR.NO_COINCIDEN,
    };
    setErrores(encontrados);
    if (Object.values(encontrados).some(Boolean)) return;

    setGuardando(true);
    try {
      await cambiarContrasena(correo, campos.nueva);
      setEditando(false);
      exito('Contraseña actualizada');
    } catch (fallo) {
      setErrorGeneral(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <Campo id="contrasena" etiqueta="Contraseña">
        <div className="flex items-center gap-3">
          <TextInput id="contrasena" type="password" value="••••••••" readOnly disabled className="flex-1" />
          <Boton tamano="sm" onClick={abrir}>
            Cambiar
          </Boton>
        </div>
      </Campo>
    );
  }

  const campo = (clave, id, etiqueta, autoComplete) => (
    <Campo id={id} etiqueta={etiqueta} error={errores[clave]}>
      <TextInput
        id={id}
        type="password"
        autoComplete={autoComplete}
        disabled={guardando}
        color={errores[clave] ? 'failure' : 'gray'}
        value={campos[clave]}
        onChange={(evento) => cambiar(clave, evento.target.value)}
      />
    </Campo>
  );

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
      {campo('nueva', 'contrasena-nueva', 'Contraseña nueva', 'new-password')}
      {campo('confirmar', 'contrasena-confirmar', 'Confirmar contraseña nueva', 'new-password')}
      <MensajeError mensaje={errorGeneral} />

      <div className="flex gap-3">
        <Boton type="submit" tamano="sm" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Boton>
        <Boton variante="contorno" tamano="sm" disabled={guardando} onClick={() => setEditando(false)}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

export default ContrasenaPerfil;

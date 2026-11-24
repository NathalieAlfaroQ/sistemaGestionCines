import { ErrorNoEncontrado } from '../errores/ErrorNoEncontrado.js';
import { ErrorProhibido } from '../errores/ErrorProhibido.js';
import { ErrorValidacion } from '../errores/ErrorValidacion.js';
import { actualizarNombre, buscarCredencial } from '../repositorios/repositorioPerfil.js';

// Mismo criterio que validarNombreOApellido del cliente
const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
// Largo máximo según la columna de cada tabla (CLIENTES: 50; EMPLEADOS y ADMINISTRADORES: 20)
const LIMITE_POR_TIPO = { CLIENTE: 50, EMPLEADO: 20, ADMINISTRADOR: 20 };

// undefined significa que el campo no se quiere cambiar; devuelve el valor sin espacios sobrantes
function validarCampo(valor, etiqueta, limite) {
  if (valor === undefined) return null;
  if (typeof valor !== 'string' || !valor.trim()) throw new ErrorValidacion(`${etiqueta} no puede quedar vacío`);

  const limpio = valor.trim();
  if (limpio.length > limite) throw new ErrorValidacion(`${etiqueta} no puede superar ${limite} caracteres`);
  if (!SOLO_LETRAS.test(limpio)) throw new ErrorValidacion(`${etiqueta}: solo se admiten letras`);
  return limpio;
}

async function ubicarFila(usuario) {
  if (usuario.proveedor === 'GOOGLE') {
    if (usuario.tipoUsuario !== 'CLIENTE' || !Number.isInteger(usuario.idCliente)) throw new ErrorValidacion('Sesión inválida');
    return { tipoUsuario: 'CLIENTE', id: usuario.idCliente };
  }

  if (!Number.isInteger(usuario.idCredencial)) throw new ErrorValidacion('Sesión inválida');

  const credencial = await buscarCredencial(usuario.idCredencial);
  if (!credencial) throw new ErrorNoEncontrado('Credencial no encontrada');

  const [tipoUsuario, idCliente, idEmpleado, idAdministrador] = credencial;
  const id = { CLIENTE: idCliente, EMPLEADO: idEmpleado, ADMINISTRADOR: idAdministrador }[tipoUsuario];
  if (!Number.isInteger(id)) throw new ErrorProhibido('Tipo de usuario desconocido');

  return { tipoUsuario, id };
}

// Cambia nombre y/o apellido del usuario de la sesión. Devuelve solo lo que cambió, ya sin espacios sobrantes.
export async function actualizarPerfil(usuario, { nombre, apellido } = {}) {
  if (nombre === undefined && apellido === undefined) throw new ErrorValidacion('Faltan datos');

  const limite = LIMITE_POR_TIPO[usuario?.tipoUsuario];
  if (!limite) throw new ErrorProhibido('Tipo de usuario desconocido');

  const nuevoNombre = validarCampo(nombre, 'El nombre', limite);
  const nuevoApellido = validarCampo(apellido, 'El apellido', limite);

  const { tipoUsuario, id } = await ubicarFila(usuario);
  await actualizarNombre(tipoUsuario, id, { nombre: nuevoNombre, apellido: nuevoApellido });

  const cambios = {};
  if (nuevoNombre !== null) cambios.nombre = nuevoNombre;
  if (nuevoApellido !== null) cambios.apellido = nuevoApellido;
  return cambios;
}
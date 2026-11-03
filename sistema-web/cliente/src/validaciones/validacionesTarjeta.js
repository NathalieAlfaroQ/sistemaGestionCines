import { hoyCostaRica } from '../utilidades/fechas.js';
import { MENSAJE_OBLIGATORIO } from './validacionesPelicula.js';

// Validaciones del formulario de tarjeta. Son las mismas que ONVO revisa antes de registrar

// Solo letras sin tilde, mayúsculas o minúsculas, la ñ y espacios entre palabras
const PATRON_TITULAR = /^[A-Za-zÑñ ]+$/;
const PATRON_VENCIMIENTO = /^(\d{2})\/(\d{2})$/;
const LARGO_MAXIMO_TITULAR = 100;

// Amex empieza con 34 o 37 y usa CVV de 4 dígitos; las demás marcas, de 3
function esAmex(numero) {
  return /^3[47]/.test(numero);
}

export function soloDigitos(texto) {
  return texto.replaceAll(/\D/g, '');
}

// Algoritmo de Luhn: detecta números de tarjeta mal escritos (un dígito cambiado, dos invertidos)
export function cumpleLuhn(numero) {
  let suma = 0;
  for (let indice = 0; indice < numero.length; indice++) {
    let digito = Number(numero[numero.length - 1 - indice]);
    if (indice % 2 === 1) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
  }
  return suma % 10 === 0;
}

function validarTitular(titular) {
  const texto = titular.trim();
  if (texto === '') return MENSAJE_OBLIGATORIO;
  if (texto.length > LARGO_MAXIMO_TITULAR) return `El nombre no puede tener más de ${LARGO_MAXIMO_TITULAR} caracteres`;
  if (!PATRON_TITULAR.test(texto)) return 'El nombre solo admite letras sin tilde';
  return null;
}

function validarNumero(numeroConEspacios) {
  if (numeroConEspacios.trim() === '') return MENSAJE_OBLIGATORIO;
  if (/[^\d ]/.test(numeroConEspacios)) return 'El número de tarjeta solo admite dígitos';
  const numero = soloDigitos(numeroConEspacios);
  if (numero.length < 13 || numero.length > 19 || !cumpleLuhn(numero)) return 'El número de tarjeta no es válido';
  return null;
}

function validarVencimiento(vencimiento) {
  if (vencimiento.trim() === '') return MENSAJE_OBLIGATORIO;
  const partes = PATRON_VENCIMIENTO.exec(vencimiento);
  if (!partes) return 'Usa el formato MM/AA';

  const mes = Number(partes[1]);
  if (mes < 1 || mes > 12) return 'El mes debe estar entre 01 y 12';

  // La tarjeta sirve hasta el último día del mes de vencimiento
  const vence = `20${partes[2]}-${partes[1]}`;
  if (vence < hoyCostaRica().slice(0, 7)) return 'La tarjeta está vencida';
  return null;
}

function validarCvv(cvv, numero) {
  if (cvv === '') return MENSAJE_OBLIGATORIO;
  const largo = esAmex(soloDigitos(numero)) ? 4 : 3;
  if (!new RegExp(String.raw`\^\d{${largo}}\$`).test(cvv)) return `El CVV debe tener ${largo} dígitos`;
  return null;
}

// Devuelve { campo: mensaje } solo con los campos que tienen error
export function validarTarjeta(formulario) {
  const errores = {
    titular: validarTitular(formulario.titular),
    numero: validarNumero(formulario.numero),
    vencimiento: validarVencimiento(formulario.vencimiento),
    cvv: validarCvv(formulario.cvv, formulario.numero),
  };
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje !== null));
}

// Datos ya validados, en el formato que pide ONVO
export function datosTarjeta(formulario) {
  const [mes, anio] = formulario.vencimiento.split('/');
  return {
    // Varios espacios seguidos se dejan en un solo espacio
    titular: formulario.titular.trim().replaceAll(/\s+/g, ' '),
    numero: soloDigitos(formulario.numero),
    mesVencimiento: Number(mes),
    anioVencimiento: 2000 + Number(anio),
    cvv: formulario.cvv,
  };
}

// Formatos mientras se escribe: '4242424242424242' -> '4242 4242 4242 4242', '1230' -> '12/30'
export function formatearNumeroTarjeta(texto) {
  return soloDigitos(texto)
    .slice(0, 19)
    .replaceAll(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatearVencimiento(texto) {
  const digitos = soloDigitos(texto).slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}
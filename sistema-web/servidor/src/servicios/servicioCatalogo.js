import { listarGeneros, listarIdiomas } from '../repositorios/repositorioCatalogo.js';

export async function obtenerGeneros() {
  return await listarGeneros();
}

export async function obtenerIdiomas() {
  return await listarIdiomas();
} 
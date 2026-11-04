export class ErrorNoAutenticado extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorNoAutenticado';
  }
}
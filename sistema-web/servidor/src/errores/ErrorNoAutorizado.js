export class ErrorNoAutorizado extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorNoAutorizado';
  }
}
export class ErrorProhibido extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorProhibido';
  }
}
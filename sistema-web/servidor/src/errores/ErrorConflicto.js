export class ErrorConflicto extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorConflicto';
  }
}
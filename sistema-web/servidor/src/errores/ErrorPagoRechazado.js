export class ErrorPagoRechazado extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorPagoRechazado';
  }
}
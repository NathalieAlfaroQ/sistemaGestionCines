export class ErrorPasarela extends Error {
  constructor(mensaje) {
    super(mensaje, { cause: causa });
    this.name = 'ErrorPasarela';
    this.idIntencion = idIntencion;
  }
}
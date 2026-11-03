export class ErrorPasarela extends Error {
  constructor(mensaje, idIntencion = null) {
    super(mensaje);
    this.name = 'ErrorPasarela';
    this.idIntencion = idIntencion;
  }
}
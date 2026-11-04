export const POS_PELICULA_CARTELERA = {
  id: 0,
  titulo: 1,
  duracion: 2,
  clasificacion: 3,
  sinopsis: 4,
  urlPoster: 5,
  urlBanner: 6,
};

export const POS_HORARIO = {
  idProyeccion: 0,
  idSede: 1,
  sede: 2,
  provincia: 3,
  idFormato: 4,
  formato: 5,
  hora: 6,
};

export const POS_PROYECCION = {
  id: 0,
  idPelicula: 1,
  fecha: 2,
  sede: 3,
  sala: 4,
  formato: 5,
};

export const POS_ASIENTO = { id: 0, fila: 1, numero: 2, ocupado: 3 };

export const POS_TIPO_BOLETO = { id: 0, nombre: 1, precio: 2 };
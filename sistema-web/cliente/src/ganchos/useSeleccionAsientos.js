import { useMemo, useState } from 'react';
import { POS_ASIENTO, POS_TIPO_BOLETO } from '../constantes/posicionesReserva.js';

export const AVISOS_SELECCION = {
  sinBoletos: 'Primero seleccione la cantidad de boletos.',
  asientosCompletos: 'Ya seleccionaste todos tus asientos. Borre uno para cambiarlo.',
  quitarAsientoPrimero: 'Borre un asiento antes de quitar un boleto.',
  sinAsientosLibres: 'No hay más asientos disponibles en esta función.',
  faltanAsientos: 'Te faltan asientos por seleccionar',
};

function etiquetaAsiento(asiento) {
  return `${asiento[POS_ASIENTO.fila]}${asiento[POS_ASIENTO.numero]}`;
}

export function useSeleccionAsientos(asientos, tiposBoleto) {
  const [cantidades, setCantidades] = useState({}); // { idTipoBoleto: cantidad }
  const [idsMarcados, setIdsMarcados] = useState([]);
  const [aviso, setAviso] = useState(null);

  const seleccionados = useMemo(
    () => asientos.filter((asiento) => idsMarcados.includes(asiento[POS_ASIENTO.id]) && !asiento[POS_ASIENTO.ocupado]),
    [asientos, idsMarcados]
  );

  const asientosLibres = useMemo(
    () => asientos.filter((asiento) => !asiento[POS_ASIENTO.ocupado]).length,
    [asientos]
  );

  const totalBoletos = Object.values(cantidades).reduce((suma, cantidad) => suma + cantidad, 0);

  const montoTotal = tiposBoleto.reduce(
    (suma, tipo) => suma + tipo[POS_TIPO_BOLETO.precio] * (cantidades[tipo[POS_TIPO_BOLETO.id]] ?? 0),
    0
  );

  function cantidadDe(idTipoBoleto) {
    return cantidades[idTipoBoleto] ?? 0;
  }

  function estaSeleccionado(idAsiento) {
    return seleccionados.some((asiento) => asiento[POS_ASIENTO.id] === idAsiento);
  }

  function alternarAsiento(asiento) {
    const idAsiento = asiento[POS_ASIENTO.id];
    if (asiento[POS_ASIENTO.ocupado]) return;

    if (estaSeleccionado(idAsiento)) {
      setIdsMarcados((anteriores) => anteriores.filter((id) => id !== idAsiento));
      setAviso(null);
      return;
    }

    if (totalBoletos === 0) {
      setAviso(AVISOS_SELECCION.sinBoletos);
      return;
    }
    if (seleccionados.length >= totalBoletos) {
      setAviso(AVISOS_SELECCION.asientosCompletos);
      return;
    }

    // Se descartan los ids que ya no son válidos (asientos vendidos al recargar el mapa)
    setIdsMarcados([...seleccionados.map((elegido) => elegido[POS_ASIENTO.id]), idAsiento]);
    setAviso(null);
  }

  function agregarBoleto(idTipoBoleto) {
    if (totalBoletos >= asientosLibres) {
      setAviso(AVISOS_SELECCION.sinAsientosLibres);
      return;
    }
    setCantidades((anteriores) => ({ ...anteriores, [idTipoBoleto]: (anteriores[idTipoBoleto] ?? 0) + 1 }));
    setAviso(null);
  }

  function quitarBoleto(idTipoBoleto) {
    if (cantidadDe(idTipoBoleto) === 0) return;

    if (totalBoletos - 1 < seleccionados.length) {
      setAviso(AVISOS_SELECCION.quitarAsientoPrimero);
      return;
    }
    setCantidades((anteriores) => ({ ...anteriores, [idTipoBoleto]: anteriores[idTipoBoleto] - 1 }));
    setAviso(null);
  }

  // Devuelve el aviso que impide continuar, o null si la selección está completa
  function validarParaContinuar() {
    if (totalBoletos === 0) return AVISOS_SELECCION.sinBoletos;
    if (seleccionados.length < totalBoletos) return AVISOS_SELECCION.faltanAsientos;
    return null;
  }

  function datosVerificacion() {
    return {
      asientos: seleccionados.map((asiento) => asiento[POS_ASIENTO.id]),
      boletos: Object.entries(cantidades)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([idTipoBoleto, cantidad]) => ({ idTipoBoleto: Number(idTipoBoleto), cantidad })),
    };
  }

  return {
    seleccionados,
    etiquetasSeleccionados: seleccionados.map(etiquetaAsiento),
    totalBoletos,
    montoTotal,
    aviso,
    setAviso,
    cantidadDe,
    estaSeleccionado,
    alternarAsiento,
    agregarBoleto,
    quitarBoleto,
    validarParaContinuar,
    datosVerificacion,
  };
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { obtenerCartelera, obtenerSedesCartelera } from '../servicios/servicioCartelera.js';
import { POS_SEDE_CARTELERA } from '../constantes/posicionesCartelera.js';

const CLAVE_SEDE_GUARDADA = 'cartelera.idSede';
const SIN_DATOS = [];

function leerSedeGuardada() {
  try {
    return localStorage.getItem(CLAVE_SEDE_GUARDADA) ?? '';
  } catch {
    return '';
  }
}

function guardarSede(idSede) {
  try {
    localStorage.setItem(CLAVE_SEDE_GUARDADA, idSede);
  } catch {
  }
}

function useCarga(consultar) {
  const [estado, setEstado] = useState({ datos: SIN_DATOS, cargando: consultar !== null, error: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (consultar === null) return undefined;

    let vigente = true;
    setEstado({ datos: SIN_DATOS, cargando: true, error: null });

    consultar()
      .then((datos) => vigente && setEstado({ datos, cargando: false, error: null }))
      .catch((error) => vigente && setEstado({ datos: SIN_DATOS, cargando: false, error }));

    return () => {
      vigente = false;
    };
  }, [consultar, intento]);

  const recargar = useCallback(() => setIntento((cuenta) => cuenta + 1), []);

  return { ...estado, recargar };
}

export function useCartelera() {
  const sedes = useCarga(obtenerSedesCartelera);
  const [sedeElegida, setSedeElegida] = useState(leerSedeGuardada);

  const idSede = useMemo(() => {
    const existe = sedes.datos.some((sede) => String(sede[POS_SEDE_CARTELERA.id]) === sedeElegida);
    if (existe) return sedeElegida;
    return sedes.datos.length > 0 ? String(sedes.datos[0][POS_SEDE_CARTELERA.id]) : '';
  }, [sedes.datos, sedeElegida]);

  const consultarCartelera = useMemo(() => (idSede === '' ? null : () => obtenerCartelera(idSede)), [idSede]);
  const cartelera = useCarga(consultarCartelera);

  function elegirSede(nuevaSede) {
    setSedeElegida(nuevaSede);
    guardarSede(nuevaSede);
  }

  return {
    sedes: sedes.datos,
    idSede,
    elegirSede,
    peliculas: idSede === '' ? SIN_DATOS : cartelera.datos,
    cargando: sedes.cargando || cartelera.cargando,
    error: sedes.error ?? cartelera.error,
    recargar: sedes.error ? sedes.recargar : cartelera.recargar,
  };
}

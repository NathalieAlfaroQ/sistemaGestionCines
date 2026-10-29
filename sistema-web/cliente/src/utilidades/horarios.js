import { POS_HORARIO } from '../constantes/posicionesReserva.js';

// Opciones únicas para un filtro, en el orden en que llegan: [{ id, nombre }]
function opcionesUnicas(horarios, posicionId, posicionNombre) {
  const vistas = new Map();
  for (const horario of horarios) {
    vistas.set(horario[posicionId], horario[posicionNombre]);
  }
  return [...vistas].map(([id, nombre]) => ({ id, nombre }));
}

export function sedesDe(horarios) {
  return opcionesUnicas(horarios, POS_HORARIO.idSede, POS_HORARIO.sede);
}

export function formatosDe(horarios) {
  return opcionesUnicas(horarios, POS_HORARIO.idFormato, POS_HORARIO.formato);
}

export function agruparHorarios(horarios, { idSede, idFormato }) {
  const sedes = new Map();

  for (const horario of horarios) {
    if (idSede && horario[POS_HORARIO.idSede] !== Number(idSede)) continue;
    if (idFormato && horario[POS_HORARIO.idFormato] !== Number(idFormato)) continue;

    const claveSede = horario[POS_HORARIO.idSede];
    if (!sedes.has(claveSede)) {
      sedes.set(claveSede, {
        idSede: claveSede,
        nombre: horario[POS_HORARIO.sede],
        provincia: horario[POS_HORARIO.provincia],
        formatos: new Map(),
      });
    }

    const formatos = sedes.get(claveSede).formatos;
    const claveFormato = horario[POS_HORARIO.idFormato];
    if (!formatos.has(claveFormato)) {
      formatos.set(claveFormato, { idFormato: claveFormato, nombre: horario[POS_HORARIO.formato], horarios: [] });
    }

    formatos.get(claveFormato).horarios.push({
      idProyeccion: horario[POS_HORARIO.idProyeccion],
      hora: horario[POS_HORARIO.hora],
    });
  }

  return [...sedes.values()].map((sede) => ({ ...sede, formatos: [...sede.formatos.values()] }));
}
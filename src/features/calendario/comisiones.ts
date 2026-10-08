import type { Clase, Comision } from "../../api/types";
import { aISO, DIAS_CORTOS } from "./fechas";

// De agosto en adelante se cursa el 2do cuatrimestre
export const cuatrimestreActual = () => (new Date().getMonth() >= 7 ? "2C" : "1C");

export const NOMBRE_CUATRIMESTRE: Record<string, string> = { "1C": "1° cuatr.", "2C": "2° cuatr.", Anual: "anual" };

// Si hay comisiones cargadas para el cuatrimestre que se esta cursando se
// muestran solo esas, asi no se mezclan con horarios de otro cuatrimestre.
export const comisionesVigentes = (lista: Comision[]) => {
  const conHorario = lista.filter((c) => c.horarios.length > 0);
  const actuales = conHorario.filter((c) => c.cuatrimestre === cuatrimestreActual());
  return actuales.length > 0 ? actuales : conHorario;
};

// Para cargar solo el horario sin preguntar se usan las del cuatrimestre actual,
// o las anuales si no hay; nunca las de otro cuatrimestre.
export const comisionesParaAutomatico = (lista: Comision[]) => {
  const conHorario = lista.filter((c) => c.horarios.length > 0);
  const actuales = conHorario.filter((c) => c.cuatrimestre === cuatrimestreActual());
  return actuales.length > 0 ? actuales : conHorario.filter((c) => c.cuatrimestre === "Anual");
};

// Meses (0 = enero) en que se cursa cada cuatrimestre: el 1° de marzo a
// julio y el 2° de agosto a diciembre
const MESES_DE_CURSADA: Record<string, [number, number]> = { "1C": [2, 6], "2C": [7, 11] };

// Una clase cargada desde una comision aparece solo en las semanas de su
// cuatrimestre; las cargadas a mano o anuales, siempre. Lo que tiene fecha
// de fin deja de aparecer despues de ese dia.
export const seCursaEl = (clase: Clase, fecha: Date) => {
  if (clase.hasta && aISO(fecha) > clase.hasta) return false;
  const meses = clase.cuatrimestre ? MESES_DE_CURSADA[clase.cuatrimestre] : undefined;
  if (!meses) return true;
  return fecha.getMonth() >= meses[0] && fecha.getMonth() <= meses[1];
};

export const resumenHorarios = (comision: Comision) =>
  comision.horarios.map((h) => `${DIAS_CORTOS[h.dia - 1]} ${h.hora_inicio}–${h.hora_fin}`).join(", ");

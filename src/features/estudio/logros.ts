import type { ResumenEstudio } from "../../api/types";

// Medallas, cotizacion y trofeos de Estudiar. Todo sale del resumen que manda
// la API (los minutos de cada dia de las ultimas 26 semanas y la meta diaria).

export type Medalla = "bronce" | "plata" | "oro";

export const NOMBRE_MEDALLA: Record<Medalla, string> = {
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
};

// Bronce al cumplir la meta, plata con una vez y media, oro con el doble
export const medallaDe = (minutos: number, meta: number): Medalla | null => {
  if (meta <= 0 || minutos < meta) return null;
  if (minutos >= meta * 2) return "oro";
  if (minutos >= meta * 1.5) return "plata";
  return "bronce";
};

// Lo que falta para la proxima medalla del dia
export const proximaMedalla = (minutos: number, meta: number): { medalla: Medalla; faltan: number } | null => {
  const escalones: [Medalla, number][] = [
    ["bronce", meta],
    ["plata", Math.ceil(meta * 1.5)],
    ["oro", meta * 2],
  ];
  const siguiente = escalones.find(([, objetivo]) => minutos < objetivo);
  return siguiente ? { medalla: siguiente[0], faltan: siguiente[1] - minutos } : null;
};

export const PRESETS_META = [30, 60, 90, 120, 180, 240, 300, 360, 480];

export interface PuntoCotizacion {
  fecha: string;
  minutos: number;
  // Acumulado de (minutos - meta) desde el primer dia del rango
  valor: number;
}

// La cotizacion sube los dias que superás la meta y baja los que no llegás,
// como una accion. Arranca en cero el primer dia que estudiaste en el rango.
export const cotizacion = (porDia: ResumenEstudio["por_dia"], meta: number, dias = 30): PuntoCotizacion[] => {
  const tramo = porDia.slice(-dias);
  const primero = tramo.findIndex((d) => d.minutos > 0);
  if (primero === -1) return [];
  let valor = 0;
  return tramo.slice(primero).map((d) => {
    valor += d.minutos - meta;
    return { fecha: d.fecha, minutos: d.minutos, valor };
  });
};

// Nivel de 0 a 4 de un dia para el calendario de actividad
export const nivelDelDia = (minutos: number, meta: number) => {
  if (minutos <= 0) return 0;
  if (minutos < meta / 2) return 1;
  if (minutos < meta) return 2;
  if (minutos < meta * 2) return 3;
  return 4;
};

// La racha mas larga de dias seguidos con estudio en el historial
export const mejorRacha = (porDia: ResumenEstudio["por_dia"]) => {
  let mejor = 0;
  let actual = 0;
  for (const d of porDia) {
    actual = d.minutos > 0 ? actual + 1 : 0;
    mejor = Math.max(mejor, actual);
  }
  return mejor;
};

export interface Trofeo {
  id: string;
  icono: string;
  nombre: string;
  descripcion: string;
  logrado: boolean;
  // De 0 a 1, para los que todavia no lograste
  avance: number;
}

const trofeo = (
  id: string,
  icono: string,
  nombre: string,
  descripcion: string,
  actual: number,
  objetivo: number
): Trofeo => ({
  id,
  icono,
  nombre,
  descripcion,
  logrado: actual >= objetivo,
  avance: Math.min(1, actual / objetivo),
});

export const trofeos = (resumen: ResumenEstudio): Trofeo[] => {
  const dias = resumen.por_dia;
  const meta = resumen.meta_diaria;
  const total = dias.reduce((suma, d) => suma + d.minutos, 0);
  const maximoDia = Math.max(0, ...dias.map((d) => d.minutos));
  const racha = Math.max(mejorRacha(dias), resumen.racha_dias);
  const medallas = dias.map((d) => medallaDe(d.minutos, meta));
  const metasCumplidas = medallas.filter(Boolean).length;
  const oros = medallas.filter((m) => m === "oro").length;
  const semanaCompleta = Math.max(
    0,
    ...dias.map((_, i) => (i >= 6 && dias.slice(i - 6, i + 1).every((d) => medallaDe(d.minutos, meta)) ? 7 : 0))
  );

  return [
    trofeo("primer-paso", "footprint", "Primer paso", "Guardá tu primera sesión", total > 0 ? 1 : 0, 1),
    trofeo("racha-3", "local_fire_department", "En llamas", "3 días seguidos estudiando", racha, 3),
    trofeo("racha-7", "whatshot", "Semana entera", "7 días seguidos estudiando", racha, 7),
    trofeo("racha-30", "military_tech", "Imparable", "30 días seguidos estudiando", racha, 30),
    trofeo("meta-1", "flag", "Meta cumplida", "Llegá a tu meta diaria", metasCumplidas, 1),
    trofeo("meta-10", "emoji_events", "Constante", "Cumplí la meta 10 días", metasCumplidas, 10),
    trofeo("semana-meta", "event_available", "Semana perfecta", "Cumplí la meta 7 días seguidos", semanaCompleta, 7),
    trofeo("oro", "workspace_premium", "Oro", "Estudiá el doble de tu meta en un día", oros, 1),
    trofeo("maraton", "directions_run", "Maratón", "4 horas en un solo día", maximoDia, 240),
    trofeo("horas-10", "hourglass_bottom", "10 horas", "Sumá 10 horas de estudio", total, 600),
    trofeo("horas-50", "hourglass_top", "50 horas", "Sumá 50 horas de estudio", total, 3000),
    trofeo("horas-100", "school", "100 horas", "Sumá 100 horas de estudio", total, 6000),
  ];
};

import type { FechaAcademica, TipoClase, TipoEvento } from "../../api/types";

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const TIPOS_EVENTO: { valor: TipoEvento; nombre: string }[] = [
  { valor: "parcial", nombre: "Parcial" },
  { valor: "final", nombre: "Final" },
  { valor: "entrega", nombre: "Entrega" },
  { valor: "recordatorio", nombre: "Recordatorio" },
  { valor: "otro", nombre: "Otro" },
];

export const TIPOS_CLASE: { valor: TipoClase; nombre: string }[] = [
  { valor: "clase", nombre: "Clase" },
  { valor: "trabajo", nombre: "Trabajo" },
  { valor: "otro", nombre: "Otra actividad" },
];

export const nombreTipo = (tipo: TipoEvento) =>
  TIPOS_EVENTO.find((t) => t.valor === tipo)?.nombre ?? tipo;

// Fechas en hora local con formato AAAA-MM-DD, igual que la API
export const aISO = (fecha: Date) => {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
};

export const desdeISO = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

export const sumarDias = (fecha: Date, dias: number) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);

// 1 = lunes ... 7 = domingo
export const diaSemana = (fecha: Date) => ((fecha.getDay() + 6) % 7) + 1;

export const inicioSemana = (fecha: Date) => sumarDias(fecha, 1 - diaSemana(fecha));

// Las 6 semanas que se muestran en la vista de mes, empezando en lunes
export const diasDelMes = (anio: number, mes: number) => {
  const primero = inicioSemana(new Date(anio, mes, 1));
  return Array.from({ length: 42 }, (_, i) => sumarDias(primero, i));
};

export const minutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const fechaLarga = (iso: string) => {
  const fecha = desdeISO(iso);
  return `${DIAS[diaSemana(fecha) - 1]} ${fecha.getDate()} de ${MESES[fecha.getMonth()].toLowerCase()}`;
};

// Dias que faltan desde hoy, para mostrar "hoy", "mañana" o "en 5 días"
export const cuantoFalta = (iso: string) => {
  const hoy = desdeISO(aISO(new Date()));
  const dias = Math.round((desdeISO(iso).getTime() - hoy.getTime()) / 86_400_000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias < 0) return `Hace ${-dias} días`;
  return `En ${dias} días`;
};

// Las fechas de la facultad que caen en el dia (los rangos incluyen sus puntas)
export const academicasDelDia = (fechas: FechaAcademica[], iso: string) =>
  fechas.filter((f) => f.desde <= iso && iso <= f.hasta);

// Los feriados y recesos pintan el dia: no hay clases
export const esDiaSinClases = (fechas: FechaAcademica[]) =>
  fechas.some((f) => f.tipo === "feriado" || f.tipo === "receso");

// Color estable para cada materia en el horario
const PALETA = ["#4f87f8", "#32a458", "#d489ef", "#fd7c2d", "#edd444", "#3cc6c6", "#f06292", "#9ccc65"];
export const colorDeMateria = (id: number | undefined) =>
  id ? PALETA[id % PALETA.length] : "#8e9094";

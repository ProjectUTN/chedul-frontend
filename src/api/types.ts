export interface Alumno {
  id: number;
  nombre: string;
  email: string;
  carrera: number;
}

export interface Carrera {
  id: number;
  nombre: string;
}

export interface Correlativa {
  materia_id: number;
  nombre: string;
  tipo: "regular" | "aprobada";
}

export interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  carga_horaria: number;
  nivel: number;
  area: string;
  tipo: string;
  cuatrimestre: string;
  horas: number;
  bloque: string;
  programa: string;
  correlativas: Correlativa[];
}

export interface Condicion {
  id: number;
  condicion: string;
}

export interface CondicionPorAlumno {
  materia_id: number;
  materia: string;
  condicion_id: number;
  condicion: string;
  nota: number | null;
}

export interface MateriaProgreso {
  id: number;
  nombre: string;
  nivel: number;
  estado_actual: string;
  nota: number | null;
  mensaje: string;
  tipo: string;
}

export interface Progreso {
  alumno_id: number;
  materias_aprobadas: MateriaProgreso[];
  materias_regularizadas: MateriaProgreso[];
  materias_cursando: MateriaProgreso[];
  materias_pendientes_disponibles: MateriaProgreso[];
  materias_pendientes_no_disponibles: MateriaProgreso[];
  obligatorias_total: number;
  obligatorias_aprobadas: number;
  porcentaje_aprobadas: number;
  promedio: number | null;
  ordenanza_531: Ordenanza531;
}

// Excepcion de correlativas del punto 5.3.1 del Reglamento de Estudios
export interface Ordenanza531 {
  puede: boolean;
  horas_faltantes: number;
  horas_limite: number;
  faltantes: MateriaProgreso[];
}

export type TipoFechaAcademica = "examen" | "cuatrimestre" | "feriado" | "receso" | "otro";

// Fecha del calendario de la facultad, igual para todos. desde y hasta son
// AAAA-MM-DD; en las de un solo dia son iguales.
export interface FechaAcademica {
  id: number;
  titulo: string;
  tipo: TipoFechaAcademica;
  desde: string;
  hasta: string;
}

export interface AporteTag {
  id: number;
  nombre: string;
}

export interface Aporte {
  id: number;
  titulo: string;
  descripcion: string;
  link: string | null;
  creado_en: string;
  materia: { id: number; nombre: string; nivel: number };
  tag: AporteTag;
  autor: { id: number; nombre: string };
  archivo: { nombre: string; tipo: string; tamano: number } | null;
  favoritos: number;
  es_favorito: boolean;
  es_mio: boolean;
}

export interface ListaAportes {
  items: Aporte[];
  total: number;
  pagina: number;
  limite: number;
}

export type TipoEvento = "parcial" | "final" | "entrega" | "recordatorio" | "otro";

export interface MateriaResumen {
  id: number;
  nombre: string;
}

export interface Evento {
  id: number;
  titulo: string;
  tipo: TipoEvento;
  fecha: string; // AAAA-MM-DD
  hora: string | null; // HH:MM
  descripcion: string;
  materia: MateriaResumen | null;
}

export interface Clase {
  id: number;
  titulo: string;
  dia: number; // 1 = lunes ... 7 = domingo
  hora_inicio: string;
  hora_fin: string;
  aula: string;
  materia: MateriaResumen | null;
  // Comision de la que se cargo; null si se cargo a mano
  comision_id: number | null;
  // Cuatrimestre de esa comision (1C, 2C); null si se cargo a mano
  cuatrimestre?: string | null;
  tipo?: TipoClase;
  // Ultimo dia en que se repite (AAAA-MM-DD); null si no termina
  hasta?: string | null;
}

// Un bloque del horario puede ser una clase u otra actividad que se repite
export type TipoClase = "clase" | "trabajo" | "otro";

export interface HorarioComision {
  dia: number; // 1 = lunes ... 7 = domingo
  hora_inicio: string;
  hora_fin: string;
  aula: string;
}

export interface Comision {
  id: number;
  codigo: string;
  cuatrimestre: string;
  horarios: HorarioComision[];
}

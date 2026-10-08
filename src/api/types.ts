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
}

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

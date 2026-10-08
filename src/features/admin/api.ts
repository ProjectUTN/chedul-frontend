import { api } from "../../api/client";

export interface CantidadPorDia {
  dia: string;
  cantidad: number;
}

export interface ResumenAdmin {
  alumnos: number;
  nuevos_7_dias: number;
  nuevos_30_dias: number;
  activos_24_horas: number;
  activos_7_dias: number;
  con_google: number;
  con_estado_cargado: number;
  aportes: number;
  comunidades: number;
  accesos_hoy: number;
  registros_por_dia: CantidadPorDia[];
  accesos_por_dia: CantidadPorDia[];
}

export interface AlumnoAdmin {
  id: number;
  nombre: string;
  email: string;
  creado: string | null;
  ultimo_acceso: string | null;
  google: boolean;
  es_admin: boolean;
  materias: number;
  aportes: number;
}

export interface AccesoAdmin {
  fecha: string;
  metodo: string;
  alumno_id: number;
  nombre: string;
  email: string;
}

export const getResumen = async () => (await api.get<ResumenAdmin>("/admin/resumen")).data;

export const getAlumnos = async (buscar: string, pagina: number) =>
  (
    await api.get<{ alumnos: AlumnoAdmin[]; total: number; por_pagina: number }>("/admin/alumnos", {
      params: { buscar, pagina },
    })
  ).data;

export const getAccesos = async () => (await api.get<AccesoAdmin[]>("/admin/accesos")).data;

// Cuantos alumnos usan Chedul (publico, para la landing)
export const getCantidadAlumnos = async () => (await api.get<{ alumnos: number }>("/estadisticas")).data.alumnos;

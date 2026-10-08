import { api } from "../../api/client";
import type { ModoEstudio, RankingEstudio, ResumenEstudio, SesionEstudio, TareaEstudio } from "../../api/types";

export const guardarSesion = async (datos: { modo: ModoEstudio; minutos: number; materia_id: number }) => {
  const response = await api.post<SesionEstudio>("/estudio/sesiones", {
    ...datos,
    materia_id: datos.materia_id || null,
  });
  return response.data;
};

export const getSesiones = async () => {
  const response = await api.get<SesionEstudio[]>("/estudio/sesiones");
  return response.data;
};

export const borrarSesion = async (id: number) => {
  await api.delete(`/estudio/sesiones/${id}`);
};

export const getResumen = async () => {
  const response = await api.get<ResumenEstudio>("/estudio/resumen");
  return response.data;
};

export const getRanking = async () => {
  const response = await api.get<RankingEstudio>("/estudio/ranking");
  return response.data;
};

export const participarEnRanking = async (participar: boolean) => {
  const response = await api.put<RankingEstudio>("/estudio/ranking", {
    participar,
  });
  return response.data;
};

export const setMetaDiaria = async (minutos: number) => {
  const response = await api.put<{ meta_diaria: number }>("/estudio/meta", {
    minutos,
  });
  return response.data.meta_diaria;
};

export interface DatosTarea {
  titulo: string;
  materia_id: number;
  hecha: boolean;
}

const tareaParaApi = (datos: DatosTarea) => ({
  ...datos,
  materia_id: datos.materia_id || null,
});

export const getTareas = async () => {
  const response = await api.get<TareaEstudio[]>("/estudio/tareas");
  return response.data;
};

export const crearTarea = async (datos: DatosTarea) => {
  const response = await api.post<TareaEstudio>("/estudio/tareas", tareaParaApi(datos));
  return response.data;
};

export const editarTarea = async (id: number, datos: DatosTarea) => {
  const response = await api.put<TareaEstudio>(`/estudio/tareas/${id}`, tareaParaApi(datos));
  return response.data;
};

export const borrarTarea = async (id: number) => {
  await api.delete(`/estudio/tareas/${id}`);
};

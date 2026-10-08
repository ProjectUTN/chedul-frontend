import { api } from "../../api/client";
import type { ModoEstudio, RankingEstudio, ResumenEstudio, SesionEstudio } from "../../api/types";

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
  const response = await api.put<RankingEstudio>("/estudio/ranking", { participar });
  return response.data;
};

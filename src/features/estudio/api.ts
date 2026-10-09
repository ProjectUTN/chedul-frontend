import { api } from "../../api/client";
import type { ModoEstudio, RankingEstudio, ResumenEstudio, SesionEstudio, TareaEstudio } from "../../api/types";

export const guardarSesion = async (datos: {
  modo: ModoEstudio;
  minutos: number;
  materia_id: number;
  // Cuando empezo de verdad (ISO), con las pausas incluidas
  inicio?: string;
}) => {
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

// Lo unico que se puede cambiar de una sesion ya guardada es su materia (0 = sin materia)
export const editarMateriaSesion = async (id: number, materiaId: number) => {
  const response = await api.put<SesionEstudio>(`/estudio/sesiones/${id}`, { materia_id: materiaId || null });
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

// El cronometro en curso vive en el servidor para retomarlo desde cualquier
// dispositivo. Los tiempos son hora del servidor (en milisegundos).
export interface EstadoTemporizadorApi {
  modo: ModoEstudio;
  fase: "foco" | "descanso";
  foco: number;
  descanso: number;
  materia_id: number;
  acumulado: number;
  desde: number | null;
  // Cuando empezo el bloque en curso
  inicio?: number | null;
}

export interface RespuestaTemporizador {
  estado: EstadoTemporizadorApi | null;
  // Version guardada: se manda de vuelta al guardar para no pisar a otro dispositivo
  rev: number;
  ahora: number;
}

export const getTemporizador = async () => {
  const response = await api.get<RespuestaTemporizador>("/estudio/temporizador");
  return response.data;
};

// Si otro dispositivo lo cambio antes, la API responde 409 con lo que hay guardado
export const guardarTemporizador = async (estado: EstadoTemporizadorApi, rev: number) => {
  const response = await api.put<RespuestaTemporizador>("/estudio/temporizador", { estado, rev });
  return response.data;
};

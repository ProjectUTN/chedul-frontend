import { api } from "../../api/client";
import type {
  Condicion,
  CondicionPorAlumno,
  Materia,
  Progreso,
} from "../../api/types";

export const getMaterias = async (carreraId: number) => {
  const response = await api.get<Materia[]>("/materias", {
    params: { carrera_id: carreraId },
  });
  return response.data;
};

export const getCondiciones = async () => {
  const response = await api.get<Condicion[]>("/condicion");
  return response.data;
};

export const getMisCondiciones = async () => {
  const response = await api.get<CondicionPorAlumno[]>("/condicion_alumno");
  return response.data;
};

export const setCondicion = async (
  materiaId: number,
  condicionId: number,
  nota: number | null
) => {
  await api.put(`/condicion_alumno/${materiaId}`, {
    condicion_id: condicionId,
    nota,
  });
};

export const borrarCondicion = async (materiaId: number) => {
  await api.delete(`/condicion_alumno/${materiaId}`);
};

export const getProgreso = async () => {
  const response = await api.get<Progreso>("/alumnos/me/progreso");
  return response.data;
};

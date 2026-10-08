import { api } from "../../api/client";
import type { Comunidad } from "../../api/types";

export interface DatosComunidad {
  nombre: string;
  descripcion: string;
  link: string;
  materia_id: number;
}

export const getComunidades = async () => {
  const response = await api.get<Comunidad[]>("/comunidades");
  return response.data;
};

export const crearComunidad = async (datos: DatosComunidad) => {
  const response = await api.post<Comunidad>("/comunidades", { ...datos, materia_id: datos.materia_id || null });
  return response.data;
};

export const borrarComunidad = async (id: number) => {
  await api.delete(`/comunidades/${id}`);
};

export const reportarComunidad = async (id: number) => {
  await api.post(`/comunidades/${id}/reportar`);
};

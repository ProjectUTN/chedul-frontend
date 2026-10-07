import { api } from "../../api/client";
import type { Clase, Comision, Evento, TipoEvento } from "../../api/types";

export interface DatosEvento {
  titulo: string;
  tipo: TipoEvento;
  fecha: string;
  hora: string;
  descripcion: string;
  materia_id: number;
}

export interface DatosClase {
  titulo: string;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  aula: string;
  materia_id: number;
}

// Los campos opcionales vacios se mandan como null
const eventoParaApi = (datos: DatosEvento) => ({
  ...datos,
  hora: datos.hora || null,
  materia_id: datos.materia_id || null,
});

const claseParaApi = (datos: DatosClase) => ({
  ...datos,
  materia_id: datos.materia_id || null,
});

export const getEventos = async (desde: string, hasta: string) => {
  const response = await api.get<Evento[]>("/eventos", { params: { desde, hasta } });
  return response.data;
};

export const crearEvento = async (datos: DatosEvento) => {
  const response = await api.post<Evento>("/eventos", eventoParaApi(datos));
  return response.data;
};

export const editarEvento = async (id: number, datos: DatosEvento) => {
  const response = await api.put<Evento>(`/eventos/${id}`, eventoParaApi(datos));
  return response.data;
};

export const borrarEvento = async (id: number) => {
  await api.delete(`/eventos/${id}`);
};

export const getClases = async () => {
  const response = await api.get<Clase[]>("/clases");
  return response.data;
};

export const crearClase = async (datos: DatosClase) => {
  const response = await api.post<Clase>("/clases", claseParaApi(datos));
  return response.data;
};

export const editarClase = async (id: number, datos: DatosClase) => {
  const response = await api.put<Clase>(`/clases/${id}`, claseParaApi(datos));
  return response.data;
};

export const borrarClase = async (id: number) => {
  await api.delete(`/clases/${id}`);
};

export const getComisiones = async (materiaId: number) => {
  const response = await api.get<Comision[]>(`/materias/${materiaId}/comisiones`);
  return response.data;
};

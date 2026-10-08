import { api } from "../../api/client";
import type { Aporte, AporteTag, ListaAportes } from "../../api/types";
import { MATERIA_CARRERA } from "./formato";

export interface FiltroAportes {
  // MATERIA_CARRERA trae solo los de toda la carrera
  materia_id?: number;
  tag_id?: number;
  q?: string;
  mios?: boolean;
  favoritos?: boolean;
  orden?: "recientes" | "populares";
  pagina?: number;
  limite?: number;
}

export interface DatosAporte {
  titulo: string;
  descripcion: string;
  // 0 es de toda la carrera
  materia_id: number;
  tag_id: number;
  link: string;
}

export const getAportes = async (filtro: FiltroAportes) => {
  const params: Record<string, string | number> = {};
  if (filtro.materia_id === MATERIA_CARRERA) params.carrera = 1;
  else if (filtro.materia_id) params.materia_id = filtro.materia_id;
  if (filtro.tag_id) params.tag_id = filtro.tag_id;
  if (filtro.q?.trim()) params.q = filtro.q.trim();
  if (filtro.mios) params.mios = 1;
  if (filtro.favoritos) params.favoritos = 1;
  if (filtro.orden) params.orden = filtro.orden;
  if (filtro.pagina) params.pagina = filtro.pagina;
  if (filtro.limite) params.limite = filtro.limite;

  const response = await api.get<ListaAportes>("/aportes", { params });
  return response.data;
};

export const getAporte = async (id: number) => {
  const response = await api.get<Aporte>(`/aportes/${id}`);
  return response.data;
};

export interface ConfigAportes {
  subida_archivos: boolean;
  max_mb: number;
}

// Si la API corre sin disco (Cloud Run), los aportes son solo links
export const getConfigAportes = async () => {
  const response = await api.get<ConfigAportes>("/aportes/config");
  return response.data;
};

export const getTags = async () => {
  const response = await api.get<AporteTag[]>("/aportes/tags");
  return response.data;
};

export const crearAporte = async (
  datos: DatosAporte,
  archivo: File | null,
  onProgreso?: (porcentaje: number) => void
) => {
  const form = new FormData();
  form.append("titulo", datos.titulo);
  form.append("descripcion", datos.descripcion);
  form.append("materia_id", String(datos.materia_id));
  form.append("tag_id", String(datos.tag_id));
  if (datos.link.trim()) form.append("link", datos.link.trim());
  if (archivo) form.append("archivo", archivo);

  const response = await api.post<Aporte>("/aportes", form, {
    onUploadProgress: (e) => {
      if (onProgreso && e.total) onProgreso(Math.round((e.loaded / e.total) * 100));
    },
  });
  return response.data;
};

export const editarAporte = async (id: number, datos: DatosAporte) => {
  const response = await api.put<Aporte>(`/aportes/${id}`, {
    ...datos,
    link: datos.link.trim() || null,
  });
  return response.data;
};

export const borrarAporte = async (id: number) => {
  await api.delete(`/aportes/${id}`);
};

export const setFavorito = async (id: number, favorito: boolean) => {
  const response = favorito
    ? await api.post<{ favoritos: number; es_favorito: boolean }>(`/aportes/${id}/favorito`)
    : await api.delete<{ favoritos: number; es_favorito: boolean }>(`/aportes/${id}/favorito`);
  return response.data;
};

// El archivo se pide con el token y se descarga desde memoria, porque un
// link comun no puede mandar el encabezado Authorization.
export const descargarArchivo = async (aporte: Aporte) => {
  const response = await api.get<Blob>(`/aportes/${aporte.id}/archivo`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = aporte.archivo?.nombre ?? "archivo";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

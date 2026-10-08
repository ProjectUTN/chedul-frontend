import { api } from "../../api/client";
import type { Alumno, Carrera } from "../../api/types";

export interface SignUpRequest {
  nombre: string;
  apellido: string;
  email: string;
  carrera_id: number;
  password: string;
}

export interface SesionResponse {
  accessToken: string;
  user: Alumno;
}

export const signup = async (data: SignUpRequest) => {
  const response = await api.post<Alumno>("/signup", data);
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await api.post<SesionResponse>("/login", { email, password });
  return response.data;
};

// Login con Google: el boton devuelve un ID token que la API verifica
export const getGoogleClientId = async () => {
  const response = await api.get<{ client_id: string }>("/auth/google");
  return response.data.client_id;
};

export const loginGoogle = async (credential: string) => {
  const response = await api.post<SesionResponse>("/auth/google", { credential });
  return response.data;
};

export const refresh = async () => {
  const response = await api.post<SesionResponse>("/refresh-token");
  return response.data;
};

export const logout = async () => {
  await api.post("/logout");
};

export const getCarreras = async () => {
  const response = await api.get<Carrera[]>("/carreras");
  return response.data;
};

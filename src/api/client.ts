import axios, { AxiosError } from "axios";

// En produccion la API va por el proxy del mismo dominio (vercel.json)
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api/v1" : "http://localhost:8080/api/v1");

export const api = axios.create({
  baseURL: API_URL,
  // Necesario para que el navegador mande la cookie del refresh token
  withCredentials: true,
});

// Errores de validacion de la API: { statusCode, msg } donde msg es un texto
// o un objeto { campo: mensaje }.
export type ErroresCampo = Record<string, string>;

export const mensajeDeError = (
  error: unknown,
  porDefecto = "Ocurrió un error, probá de nuevo"
): string => {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.msg;
    if (typeof msg === "string") return msg;
    if (msg && typeof msg === "object") {
      return Object.values(msg as ErroresCampo).join(". ");
    }
    if (!error.response) return "No se pudo conectar con el servidor";
  }
  return porDefecto;
};

export const erroresDeCampo = (error: unknown): ErroresCampo => {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.msg;
    if (msg && typeof msg === "object") return msg as ErroresCampo;
  }
  return {};
};

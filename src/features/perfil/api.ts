import { api } from "../../api/client";
import type { Alumno } from "../../api/types";

export const actualizarPerfil = async (nombre: string, apellido: string, carrera_id: number) => {
  const response = await api.put<Alumno>("/alumnos/me", { nombre, apellido, carrera_id });
  return response.data;
};

export const cambiarPassword = async (actual: string, nueva: string) => {
  await api.put("/alumnos/me/password", { actual, nueva });
};

export const borrarCuenta = async () => {
  await api.delete("/alumnos/me");
};

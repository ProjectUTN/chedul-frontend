import { api } from "../../api/client";

export interface SignUpRequest {
  nombre: string;
  email: string;
  carrera: string;
  password: string;
}

export const signup = async (data: SignUpRequest) => {
  const response = await api.post("/signup", data);

  return response.data;
};

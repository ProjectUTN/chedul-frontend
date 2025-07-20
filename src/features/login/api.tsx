import { api } from "../../api/client";

export interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (data: LoginRequest) => {
  const response = await api.post("/login", data);

  return response.data;
};

import { api } from "../../api/client";

export interface getAlumnoRequest {
  id: string;
}

export const getAlumno = async (data: getAlumnoRequest) => {
  const response = await api.get(`/get/${data.id}`);

  return response.data;
};
